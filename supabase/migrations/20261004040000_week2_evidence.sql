-- Migration: week2_evidence.sql

-- 1a. Hardening of Week 1 functions: recreate delete_case and increment_case_state_version with set search_path = '' and fully-qualified names
create or replace function public.delete_case(case_id uuid)
returns void as $$
begin
  update public.decision_cases
  set deleted_at = now()
  where id = case_id
    and owner_id = auth.uid()
    and deleted_at is null;
end;
$$ language plpgsql security definer set search_path = '';

create or replace function public.increment_case_state_version()
returns trigger as $$
declare
  target_case_id uuid;
  target_property_id uuid;
begin
  if (tg_table_name = 'property_facts') then
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
$$ language plpgsql security definer set search_path = '';

-- 1b. Extend decision_cases.status check constraint
alter table public.decision_cases
  drop constraint if exists decision_cases_status_check;

alter table public.decision_cases
  add constraint decision_cases_status_check
  check (status in ('draft', 'needs_complete', 'properties_complete', 'analyzed'));

-- 1c. extraction_runs table
create table if not exists public.extraction_runs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  status text not null check (status in ('running', 'succeeded', 'failed')),
  error_code text,
  source_snapshot text,
  model text,
  prompt_version text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists idx_extraction_runs_property_started
  on public.extraction_runs (property_id, started_at desc);

create unique index if not exists idx_extraction_runs_single_running
  on public.extraction_runs (property_id)
  where (status = 'running');

-- 1d. property_facts table
create table if not exists public.property_facts (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  extraction_run_id uuid references public.extraction_runs(id) on delete cascade,
  field text not null check (field in (
    'listing_price_sar',
    'area_sqm',
    'bedrooms',
    'bathrooms',
    'floor_no',
    'building_floors',
    'property_age_years',
    'elevator',
    'private_parking',
    'district',
    'listing_claim'
  )),
  value jsonb not null,
  raw_text text,
  scope text not null check (scope in ('unit', 'building', 'neighborhood')),
  source text not null check (source in ('url', 'image', 'manual', 'user_correction')),
  evidence_text text check (evidence_text is null or length(evidence_text) <= 300),
  evidence_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_property_facts_property_field
  on public.property_facts (property_id, field);

-- 1e. Trigger: increment state_version on property_facts insert/update/delete
drop trigger if exists trigger_state_version_property_facts on public.property_facts;

create trigger trigger_state_version_property_facts
after insert or update or delete on public.property_facts
for each row execute function public.increment_case_state_version();

-- 1f. RLS: extraction_runs & property_facts (SELECT only for authenticated owner of case)
alter table public.extraction_runs enable row level security;
alter table public.property_facts enable row level security;

drop policy if exists "Users can select own extraction runs" on public.extraction_runs;
create policy "Users can select own extraction runs"
on public.extraction_runs for select
to authenticated
using (
  exists (
    select 1 from public.properties p
    join public.decision_cases c on c.id = p.case_id
    where p.id = extraction_runs.property_id
      and c.owner_id = auth.uid()
      and c.deleted_at is null
  )
);

drop policy if exists "Users can select own property facts" on public.property_facts;
create policy "Users can select own property facts"
on public.property_facts for select
to authenticated
using (
  exists (
    select 1 from public.properties p
    join public.decision_cases c on c.id = p.case_id
    where p.id = property_facts.property_id
      and c.owner_id = auth.uid()
      and c.deleted_at is null
  )
);
