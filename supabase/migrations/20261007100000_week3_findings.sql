-- Migration: 20261007100000_week3_findings.sql
-- Week 3 Phase 4: On-site Inspection Findings

create table if not exists public.inspection_findings (
  id uuid primary key default gen_random_uuid(),
  inspection_item_id uuid not null references public.inspection_items(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  result text not null check (result in ('good', 'problem', 'not_checked')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (inspection_item_id)
);

create index if not exists idx_inspection_findings_property_id
  on public.inspection_findings (property_id);

-- RLS: owner SELECT only on inspection_findings. Mutations through admin client after server verification.
alter table public.inspection_findings enable row level security;

drop policy if exists "Users can select own inspection findings" on public.inspection_findings;
create policy "Users can select own inspection findings"
on public.inspection_findings for select
to authenticated
using (
  exists (
    select 1 from public.properties p
    join public.decision_cases c on c.id = p.case_id
    where p.id = inspection_findings.property_id
      and c.owner_id = auth.uid()
      and c.deleted_at is null
  )
);

-- Trigger to increment decision_cases.state_version on inspection_findings mutation
create or replace function public.increment_case_state_version()
returns trigger as $$
declare
  target_case_id uuid;
  target_property_id uuid;
begin
  if (tg_table_name in ('property_facts', 'inspection_findings')) then
    if (tg_op = 'DELETE') then
      target_property_id := old.property_id;
    else
      target_property_id := new.property_id;
    end if;

    select p.case_id into target_case_id
    from public.properties p
    where p.id = target_property_id;
  else
    if (tg_op = 'DELETE') then
      target_case_id := old.case_id;
    else
      target_case_id := new.case_id;
    end if;
  end if;

  if (target_case_id is not null) then
    update public.decision_cases
    set state_version = state_version + 1,
        updated_at = now()
    where id = target_case_id;
  end if;

  if (tg_op = 'DELETE') then
    return old;
  else
    return new;
  end if;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_state_version_inspection_findings on public.inspection_findings;
create trigger trigger_state_version_inspection_findings
after insert or update or delete on public.inspection_findings
for each row execute function public.increment_case_state_version();
