-- Migration: 20261007110000_week3_reassessment.sql
-- Week 3 Phase 5: Reassessment Engine & Visual Diff on On-Site Findings

-- 1. Create reassessment_logs table
create table if not exists public.reassessment_logs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.decision_cases(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  assessment_id uuid references public.property_assessments(id) on delete set null,
  base_state_version int not null,
  previous_fit_rating text not null,
  new_fit_rating text not null,
  previous_visit_priority text not null,
  new_visit_priority text not null,
  diff jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_reassessment_logs_case_prop
  on public.reassessment_logs (case_id, property_id, created_at desc);

-- 2. RLS on reassessment_logs
alter table public.reassessment_logs enable row level security;

drop policy if exists "Users can select own reassessment logs" on public.reassessment_logs;
create policy "Users can select own reassessment logs"
on public.reassessment_logs for select
to authenticated
using (
  exists (
    select 1 from public.decision_cases c
    where c.id = reassessment_logs.case_id
      and c.owner_id = auth.uid()
      and c.deleted_at is null
  )
);

-- 3. Atomic commit_reassessment function
create or replace function public.commit_reassessment(
  p_case_id uuid,
  p_property_id uuid,
  p_base_state_version int,
  p_new_assessment jsonb,
  p_diff jsonb
) returns text as $$
declare
  v_case_version int;
  v_case_deleted_at timestamptz;
  v_latest_run_id uuid;
  v_assessment_id uuid;
  v_prev_fit_rating text;
  v_prev_visit_priority text;
begin
  -- 1. Lock decision_cases row
  select state_version, deleted_at
    into v_case_version, v_case_deleted_at
    from public.decision_cases
   where id = p_case_id
     for update;

  if v_case_version is null or v_case_deleted_at is not null then
    return 'case_deleted';
  end if;

  -- 2. Concurrency check: Reject if state changed while reassessing
  if v_case_version <> p_base_state_version then
    return 'stale_state';
  end if;

  -- 3. Find latest committed analysis run for this case
  select id into v_latest_run_id
    from public.analysis_runs
   where case_id = p_case_id
     and status = 'committed'
   order by finished_at desc nulls last, created_at desc
   limit 1;

  if v_latest_run_id is null then
    return 'no_committed_run';
  end if;

  -- 4. Find existing assessment for this property in the latest run
  select id, fit_rating, visit_priority
    into v_assessment_id, v_prev_fit_rating, v_prev_visit_priority
    from public.property_assessments
   where run_id = v_latest_run_id
     and property_id = p_property_id;

  if v_assessment_id is null then
    return 'assessment_not_found';
  end if;

  -- 5. Update property_assessments row
  update public.property_assessments
     set constraint_results = p_new_assessment->'constraint_results',
         fit_rating = p_new_assessment->>'fit_rating',
         fit_summary = p_new_assessment->>'fit_summary',
         strengths = coalesce(p_new_assessment->'strengths', '[]'::jsonb),
         risks = coalesce(p_new_assessment->'risks', '[]'::jsonb),
         key_unknowns = coalesce(p_new_assessment->'key_unknowns', '[]'::jsonb),
         visit_priority = p_new_assessment->>'visit_priority',
         visit_priority_reason = p_new_assessment->>'visit_priority_reason'
   where id = v_assessment_id;

  -- 6. Insert record into reassessment_logs
  insert into public.reassessment_logs (
    case_id,
    property_id,
    assessment_id,
    base_state_version,
    previous_fit_rating,
    new_fit_rating,
    previous_visit_priority,
    new_visit_priority,
    diff
  ) values (
    p_case_id,
    p_property_id,
    v_assessment_id,
    p_base_state_version,
    v_prev_fit_rating,
    p_new_assessment->>'fit_rating',
    v_prev_visit_priority,
    p_new_assessment->>'visit_priority',
    p_diff
  );

  -- 7. Ensure case status is analyzed
  update public.decision_cases
     set status = 'analyzed',
         updated_at = now()
   where id = p_case_id;

  return 'committed';
end;
$$ language plpgsql security definer set search_path = '';

-- Permissions: executable by service_role only
revoke all on function public.commit_reassessment(uuid, uuid, int, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.commit_reassessment(uuid, uuid, int, jsonb, jsonb) to service_role;
