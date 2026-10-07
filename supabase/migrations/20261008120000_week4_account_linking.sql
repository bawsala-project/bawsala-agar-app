-- Migration: 20261008120000_week4_account_linking.sql
-- Week 4: link an anonymous guest's cases to a permanent account

-- Moves every case owned by the calling guest to the permanent account.
-- Runs as definer because the caller can no longer pass the owner-scoped RLS
-- check once ownership changes. Only anonymous callers may use it, and the
-- target must be an existing non-anonymous user.
create or replace function public.link_guest_cases_to_user(target_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_id uuid := auth.uid();
  linked_count integer;
begin
  if caller_id is null then
    raise exception 'Not authenticated';
  end if;

  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is not true then
    raise exception 'Only guest sessions can be linked';
  end if;

  if target_user_id = caller_id then
    raise exception 'Target account must differ from the guest session';
  end if;

  if not exists (
    select 1 from auth.users u
    where u.id = target_user_id
      and coalesce(u.is_anonymous, false) = false
  ) then
    raise exception 'Target account does not exist';
  end if;

  update public.decision_cases
  set owner_id = target_user_id
  where owner_id = caller_id;

  get diagnostics linked_count = row_count;
  return linked_count;
end;
$$;

revoke all on function public.link_guest_cases_to_user(uuid) from public, anon;
grant execute on function public.link_guest_cases_to_user(uuid) to authenticated;

-- Property images stay at <guest_id>/<case_id>/<file>. Grant the case's current
-- owner access by case folder so linked accounts keep their uploads.
drop policy if exists "Case owners can read case images" on storage.objects;
create policy "Case owners can read case images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'property-images'
  and exists (
    select 1 from public.decision_cases c
    where c.id::text = (storage.foldername(name))[2]
      and c.owner_id = auth.uid()
      and c.deleted_at is null
  )
);

drop policy if exists "Case owners can delete case images" on storage.objects;
create policy "Case owners can delete case images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'property-images'
  and exists (
    select 1 from public.decision_cases c
    where c.id::text = (storage.foldername(name))[2]
      and c.owner_id = auth.uid()
      and c.deleted_at is null
  )
);
