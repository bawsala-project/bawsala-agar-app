-- Test Suite: week2_analysis.sql
-- Acceptance 3: commit_analysis permissions, matching commit, stale_state, and case_deleted

begin;

-- Clean prior test artifacts
delete from public.decision_cases where id = 'c0000000-0000-0000-0000-000000000003';

-- 1. Setup test case and property
insert into public.decision_cases (id, owner_id, city, status)
values ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'الرياض', 'draft');

insert into public.properties (id, case_id, input_mode, title)
values ('f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'manual', 'شقة اختبار التحليل');

-- Current state_version is 2 (1 initial + 1 on property insert)
do $$
declare
  v_version int;
  v_res text;
  v_run_id uuid := 'e0000000-0000-0000-0000-000000000001';
  v_count int;
  v_run_status text;
  v_case_status text;
begin
  select state_version into v_version from public.decision_cases where id = 'c0000000-0000-0000-0000-000000000003';
  assert v_version = 2, 'Case state_version should be 2';

  -- Create a running analysis run with matching base_state_version = 2
  insert into public.analysis_runs (id, case_id, base_state_version, status, model, prompt_version)
  values (v_run_id, 'c0000000-0000-0000-0000-000000000003', 2, 'running', 'gemini-flash-lite', 'v1');

  -- Call commit_analysis with sample assessment payload
  v_res := public.commit_analysis(
    v_run_id,
    jsonb_build_array(
      jsonb_build_object(
        'property_id', 'f0000000-0000-0000-0000-000000000003',
        'constraint_results', '[]'::jsonb,
        'price_per_sqm', 7500.00,
        'fit_rating', 'strong',
        'fit_summary', 'شقة مناسبة جدًا للميزانية',
        'strengths', '["سعر ممتاز"]'::jsonb,
        'risks', '[]'::jsonb,
        'key_unknowns', '[]'::jsonb,
        'visit_priority', 'high',
        'visit_priority_reason', 'ينصح بزيارتها فورًا',
        'evidence_fields', '["listing_price_sar", "area_sqm"]'::jsonb
      )
    )
  );

  assert v_res = 'committed', 'commit_analysis must return committed on matching version';

  select count(*) into v_count from public.property_assessments where run_id = v_run_id;
  assert v_count = 1, 'property_assessments row must be inserted';

  select status into v_run_status from public.analysis_runs where id = v_run_id;
  assert v_run_status = 'committed', 'analysis_runs status must be committed';

  select status into v_case_status from public.decision_cases where id = 'c0000000-0000-0000-0000-000000000003';
  assert v_case_status = 'analyzed', 'decision_cases status must be analyzed';
end $$;

-- 2. Test stale_state after bumping state_version
do $$
declare
  v_res text;
  v_stale_run_id uuid := 'e0000000-0000-0000-0000-000000000002';
  v_count int;
  v_run_status text;
  v_outcome text;
begin
  -- Bump state_version: insert a fact or update case
  update public.decision_cases
  set state_version = state_version + 1
  where id = 'c0000000-0000-0000-0000-000000000003';

  -- Create run with old base_state_version = 2 (while case is now 3)
  insert into public.analysis_runs (id, case_id, base_state_version, status, model, prompt_version)
  values (v_stale_run_id, 'c0000000-0000-0000-0000-000000000003', 2, 'running', 'gemini-flash-lite', 'v1');

  v_res := public.commit_analysis(
    v_stale_run_id,
    jsonb_build_array(
      jsonb_build_object(
        'property_id', 'f0000000-0000-0000-0000-000000000003',
        'constraint_results', '[]'::jsonb,
        'price_per_sqm', 7500.00,
        'fit_rating', 'weak',
        'fit_summary', 'stale summary',
        'strengths', '[]'::jsonb,
        'risks', '[]'::jsonb,
        'key_unknowns', '[]'::jsonb,
        'visit_priority', 'low',
        'visit_priority_reason', 'stale reason',
        'evidence_fields', '[]'::jsonb
      )
    )
  );

  assert v_res = 'stale_state', 'commit_analysis must return stale_state when version mismatch';

  select count(*) into v_count from public.property_assessments where run_id = v_stale_run_id;
  assert v_count = 0, 'No assessments must be written for stale_state';

  select status, outcome_code into v_run_status, v_outcome from public.analysis_runs where id = v_stale_run_id;
  assert v_run_status = 'discarded', 'Run status must be discarded on stale_state';
  assert v_outcome = 'stale_state', 'Outcome code must be stale_state';
end $$;

-- 3. Test case_deleted
do $$
declare
  v_res text;
  v_del_run_id uuid := 'e0000000-0000-0000-0000-000000000003';
  v_count int;
  v_run_status text;
  v_outcome text;
  v_curr_ver int;
begin
  select state_version into v_curr_ver from public.decision_cases where id = 'c0000000-0000-0000-0000-000000000003';

  -- Create run matching current version
  insert into public.analysis_runs (id, case_id, base_state_version, status, model, prompt_version)
  values (v_del_run_id, 'c0000000-0000-0000-0000-000000000003', v_curr_ver, 'running', 'gemini-flash-lite', 'v1');

  -- Soft delete the case
  update public.decision_cases set deleted_at = now() where id = 'c0000000-0000-0000-0000-000000000003';

  v_res := public.commit_analysis(
    v_del_run_id,
    jsonb_build_array(
      jsonb_build_object(
        'property_id', 'f0000000-0000-0000-0000-000000000003',
        'constraint_results', '[]'::jsonb,
        'price_per_sqm', 7500.00,
        'fit_rating', 'weak',
        'fit_summary', 'deleted case summary',
        'strengths', '[]'::jsonb,
        'risks', '[]'::jsonb,
        'key_unknowns', '[]'::jsonb,
        'visit_priority', 'low',
        'visit_priority_reason', 'deleted case reason',
        'evidence_fields', '[]'::jsonb
      )
    )
  );

  assert v_res = 'case_deleted', 'commit_analysis must return case_deleted on soft-deleted case';

  select count(*) into v_count from public.property_assessments where run_id = v_del_run_id;
  assert v_count = 0, 'No assessments must be written for case_deleted';

  select status, outcome_code into v_run_status, v_outcome from public.analysis_runs where id = v_del_run_id;
  assert v_run_status = 'discarded', 'Run status must be discarded on case_deleted';
  assert v_outcome = 'case_deleted', 'Outcome code must be case_deleted';
end $$;

-- 4. Test permissions: authenticated role cannot execute commit_analysis
do $$
declare
  v_denied boolean := false;
begin
  set local role authenticated;
  set local "request.jwt.claim.sub" to 'a0000000-0000-0000-0000-000000000001';

  begin
    perform public.commit_analysis(
      'e0000000-0000-0000-0000-000000000001',
      '[]'::jsonb
    );
  exception
    when insufficient_privilege then
      v_denied := true;
  end;

  assert v_denied = true, 'Authenticated role must be denied execution of commit_analysis';
end $$;

rollback;
