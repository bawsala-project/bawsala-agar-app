-- Migration: 20261006080000_week2_analysis.sql
-- Week 2 Phase 5: Per-Property Assessment & Atomic Commit

-- 1. analysis_runs table
create table if not exists public.analysis_runs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.decision_cases(id) on delete cascade,
  base_state_version int not null,
  status text not null check (status in ('running', 'committed', 'discarded', 'failed')),
  outcome_code text,
  model text,
  prompt_version text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists idx_analysis_runs_case_id
  on public.analysis_runs (case_id, created_at desc);

create unique index if not exists idx_analysis_runs_one_running_per_case
  on public.analysis_runs (case_id)
  where (status = 'running');

-- 2. property_assessments table
create table if not exists public.property_assessments (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.analysis_runs(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  constraint_results jsonb not null,
  price_per_sqm numeric(10, 2),
  fit_rating text not null check (fit_rating in ('strong', 'partial', 'weak', 'insufficient_evidence')),
  fit_summary text not null,
  strengths jsonb not null,
  risks jsonb not null,
  key_unknowns jsonb not null,
  visit_priority text not null check (visit_priority in ('high', 'medium', 'low', 'insufficient_evidence')),
  visit_priority_reason text not null,
  evidence_fields text[] not null,
  created_at timestamptz not null default now(),
  unique (run_id, property_id)
);

create index if not exists idx_property_assessments_run_id
  on public.property_assessments (run_id);

-- 3. RLS: owner SELECT only on both tables
alter table public.analysis_runs enable row level security;
alter table public.property_assessments enable row level security;

drop policy if exists "Users can select own analysis runs" on public.analysis_runs;
create policy "Users can select own analysis runs"
on public.analysis_runs for select
to authenticated
using (
  exists (
    select 1 from public.decision_cases c
    where c.id = analysis_runs.case_id
      and c.owner_id = auth.uid()
      and c.deleted_at is null
  )
);

drop policy if exists "Users can select own property assessments" on public.property_assessments;
create policy "Users can select own property assessments"
on public.property_assessments for select
to authenticated
using (
  exists (
    select 1 from public.analysis_runs ar
    join public.decision_cases c on c.id = ar.case_id
    where ar.id = property_assessments.run_id
      and c.owner_id = auth.uid()
      and c.deleted_at is null
  )
);

-- 4. Function commit_analysis
create or replace function public.commit_analysis(
  p_run_id uuid,
  p_assessments jsonb
) returns text as $$
declare
  v_case_id uuid;
  v_base_state_version int;
  v_case_version int;
  v_case_deleted_at timestamptz;
begin
  -- 1. Find the run
  select case_id, base_state_version
    into v_case_id, v_base_state_version
    from public.analysis_runs
   where id = p_run_id;

  if v_case_id is null then
    return 'run_not_found';
  end if;

  -- 2. Lock the case row
  select state_version, deleted_at
    into v_case_version, v_case_deleted_at
    from public.decision_cases
   where id = v_case_id
     for update;

  -- If case is missing or deleted
  if v_case_version is null or v_case_deleted_at is not null then
    update public.analysis_runs
       set status = 'discarded',
           outcome_code = 'case_deleted',
           finished_at = now()
     where id = p_run_id;
    return 'case_deleted';
  end if;

  -- If state_version does not match base_state_version
  if v_case_version <> v_base_state_version then
    update public.analysis_runs
       set status = 'discarded',
           outcome_code = 'stale_state',
           finished_at = now()
     where id = p_run_id;
    return 'stale_state';
  end if;

  -- Insert assessments
  insert into public.property_assessments (
    run_id,
    property_id,
    constraint_results,
    price_per_sqm,
    fit_rating,
    fit_summary,
    strengths,
    risks,
    key_unknowns,
    visit_priority,
    visit_priority_reason,
    evidence_fields
  )
  select
    p_run_id,
    (item->>'property_id')::uuid,
    (item->'constraint_results'),
    (item->>'price_per_sqm')::numeric,
    (item->>'fit_rating'),
    (item->>'fit_summary'),
    coalesce(item->'strengths', '[]'::jsonb),
    coalesce(item->'risks', '[]'::jsonb),
    coalesce(item->'key_unknowns', '[]'::jsonb),
    (item->>'visit_priority'),
    (item->>'visit_priority_reason'),
    coalesce((select array_agg(elem::text) from jsonb_array_elements_text(item->'evidence_fields') as elem), array[]::text[])
  from jsonb_array_elements(p_assessments) as item;

  -- Mark run committed
  update public.analysis_runs
     set status = 'committed',
         finished_at = now()
   where id = p_run_id;

  -- Set case status analyzed
  update public.decision_cases
     set status = 'analyzed',
         updated_at = now()
   where id = v_case_id;

  return 'committed';
end;
$$ language plpgsql security definer set search_path = '';

-- Permissions: executable by service_role only
revoke all on function public.commit_analysis(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.commit_analysis(uuid, jsonb) to service_role;
