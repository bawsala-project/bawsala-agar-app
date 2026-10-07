-- Migration: 20261008140000_week4_security_hardening.sql
-- Fix C2: Hardened link_guest_cases_to_user with search_path = ''
-- Fix C3: Protect decision_cases authority columns from direct client tampering

-- 1. Hardened link_guest_cases_to_user (C2)
create or replace function public.link_guest_cases_to_user(target_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
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

-- 2. Protect decision_cases authority columns from direct client tampering (C3)
create or replace function public.protect_case_authority_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  v_role := coalesce(current_setting('request.jwt.claim.role', true), current_setting('role', true));
  if v_role = 'service_role' then
    return new;
  end if;

  -- Block direct client mutation of state_version
  if new.state_version <> old.state_version and session_user = 'authenticated' then
    raise exception 'Direct modification of state_version is forbidden';
  end if;

  -- Block direct client mutation of deleted_at (must use delete_case RPC)
  if new.deleted_at is distinct from old.deleted_at and session_user = 'authenticated' then
    raise exception 'Direct modification of deleted_at is forbidden; use delete_case()';
  end if;

  -- Block direct client mutation of owner_id (must use link_guest_cases_to_user RPC)
  if new.owner_id <> old.owner_id and session_user = 'authenticated' then
    raise exception 'Direct modification of owner_id is forbidden; use link_guest_cases_to_user()';
  end if;

  -- Prevent jumping directly to analyzed status from client
  if new.status = 'analyzed' and old.status <> 'analyzed' and session_user = 'authenticated' then
    raise exception 'Cannot directly transition status to analyzed from client; must complete analysis';
  end if;

  return new;
end;
$$;

drop trigger if exists trigger_protect_case_authority on public.decision_cases;
create trigger trigger_protect_case_authority
before update on public.decision_cases
for each row execute function public.protect_case_authority_columns();
