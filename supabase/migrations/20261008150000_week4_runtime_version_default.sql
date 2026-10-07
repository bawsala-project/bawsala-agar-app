-- Migration: 20261008150000_week4_runtime_version_default.sql
-- Ensure analysis_runtime_version has a non-null default on tables and commit_reassessment

alter table public.analysis_runs
  alter column analysis_runtime_version set default 'bawsala-v1.9-p1.0';

alter table public.reassessment_logs
  alter column analysis_runtime_version set default 'bawsala-v1.9-p1.0';

update public.analysis_runs
   set analysis_runtime_version = 'bawsala-v1.9-p1.0'
 where analysis_runtime_version is null;

update public.reassessment_logs
   set analysis_runtime_version = 'bawsala-v1.9-p1.0'
 where analysis_runtime_version is null;

-- Update commit_reassessment default parameter to the current runtime version
create or replace function public.commit_reassessment(
  p_case_id uuid,
  p_property_id uuid,
  p_base_state_version int,
  p_new_assessment jsonb,
  p_diff jsonb,
  p_runtime_version text default 'bawsala-v1.9-p1.0'
) returns text as $$
declare
  v_case_version int;
  v_case_deleted_at timestamptz;
  v_latest_run_id uuid;
  v_assessment_id uuid;
  v_prev_fit_rating text;
  v_prev_visit_priority text;
begin
  select state_version, deleted_at
    into v_case_version, v_case_deleted_at
    from public.decision_cases
   where id = p_case_id
     for update;

  if v_case_version is null or v_case_deleted_at is not null then
    return 'case_deleted';
  end if;

  if v_case_version <> p_base_state_version then
    return 'stale_state';
  end if;

  select id into v_latest_run_id
    from public.analysis_runs
   where case_id = p_case_id
     and status = 'committed'
   order by finished_at desc nulls last, created_at desc
   limit 1;

  if v_latest_run_id is null then
    return 'no_committed_run';
  end if;

  select id, fit_rating, visit_priority
    into v_assessment_id, v_prev_fit_rating, v_prev_visit_priority
    from public.property_assessments
   where run_id = v_latest_run_id
     and property_id = p_property_id;

  if v_assessment_id is null then
    return 'assessment_not_found';
  end if;

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

  insert into public.reassessment_logs (
    case_id,
    property_id,
    assessment_id,
    base_state_version,
    previous_fit_rating,
    new_fit_rating,
    previous_visit_priority,
    new_visit_priority,
    diff,
    analysis_runtime_version
  ) values (
    p_case_id,
    p_property_id,
    v_assessment_id,
    p_base_state_version,
    v_prev_fit_rating,
    p_new_assessment->>'fit_rating',
    v_prev_visit_priority,
    p_new_assessment->>'visit_priority',
    p_diff,
    coalesce(p_runtime_version, 'bawsala-v1.9-p1.0')
  );

  update public.decision_cases
     set status = 'analyzed',
         updated_at = now()
   where id = p_case_id;

  return 'committed';
end;
$$ language plpgsql security definer set search_path = '';

revoke all on function public.commit_reassessment(uuid, uuid, int, jsonb, jsonb, text) from public, anon, authenticated;
grant execute on function public.commit_reassessment(uuid, uuid, int, jsonb, jsonb, text) to service_role;
