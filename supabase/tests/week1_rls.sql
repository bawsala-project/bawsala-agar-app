-- Test Suite: week1_rls.sql
-- Acceptance Test for Week 1 Schema and Row Level Security

begin;

-- Create test users in auth.users
insert into auth.users (id, aud, role, email)
values
  ('a0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'user_a@test.sa'),
  ('b0000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'user_b@test.sa')
on conflict (id) do nothing;

-- Ensure clean state for test IDs if prior runs failed
delete from public.decision_cases where id = 'c0000000-0000-0000-0000-000000000001';

-- ============================================================================
-- Test A: User A creates a case, requirements, and properties
-- ============================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', false);
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}', false);

insert into public.decision_cases (id, owner_id, city)
values ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'الرياض');

do $$
declare
  v_version int;
begin
  select state_version into v_version from public.decision_cases where id = 'c0000000-0000-0000-0000-000000000001';
  assert v_version = 1, 'Initial state_version must be 1';
end $$;

-- Insert requirements
insert into public.requirements (case_id, max_budget_sar, purchase_method, household_size, min_bedrooms)
values ('c0000000-0000-0000-0000-000000000001', 850000, 'cash', 4, 3);

-- Verify state_version incremented to 2
do $$
declare
  v_version int;
begin
  select state_version into v_version from public.decision_cases where id = 'c0000000-0000-0000-0000-000000000001';
  assert v_version = 2, 'state_version must increment after requirements insert';
end $$;

-- Insert 5 properties
insert into public.properties (id, case_id, input_mode, title)
values
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'manual', 'شقة 1'),
  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'manual', 'شقة 2'),
  ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'manual', 'شقة 3'),
  ('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'manual', 'شقة 4'),
  ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'manual', 'شقة 5');

-- Verify state_version after 5 property inserts (2 + 5 = 7)
do $$
declare
  v_version int;
  v_count int;
begin
  select state_version into v_version from public.decision_cases where id = 'c0000000-0000-0000-0000-000000000001';
  assert v_version = 7, 'state_version must increment after each property insert';

  select count(*) into v_count from public.properties where case_id = 'c0000000-0000-0000-0000-000000000001';
  assert v_count = 5, 'User A must have 5 properties';
end $$;

-- ============================================================================
-- Test C: 6th property insert is rejected
-- ============================================================================
do $$
begin
  begin
    insert into public.properties (id, case_id, input_mode, title)
    values ('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'manual', 'شقة 6');
    raise exception '6th property insert should have failed!';
  exception
    when others then
      assert sqlerrm like '%Cannot add more than 5 properties to a case%', 'Error must be property limit violation';
  end;
end $$;

-- ============================================================================
-- Test B: User B cannot select, update, or delete any of User A's rows
-- ============================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000002', false);
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000002","role":"authenticated"}', false);

do $$
declare
  v_count int;
  v_rows_affected int;
begin
  -- Select checks
  select count(*) into v_count from public.decision_cases where id = 'c0000000-0000-0000-0000-000000000001';
  assert v_count = 0, 'User B must not see User A decision_cases';

  select count(*) into v_count from public.requirements where case_id = 'c0000000-0000-0000-0000-000000000001';
  assert v_count = 0, 'User B must not see User A requirements';

  select count(*) into v_count from public.properties where case_id = 'c0000000-0000-0000-0000-000000000001';
  assert v_count = 0, 'User B must not see User A properties';

  -- Update checks
  update public.decision_cases set city = 'جدة' where id = 'c0000000-0000-0000-0000-000000000001';
  get diagnostics v_rows_affected = row_count;
  assert v_rows_affected = 0, 'User B cannot update User A decision_cases';

  update public.requirements set max_budget_sar = 999999 where case_id = 'c0000000-0000-0000-0000-000000000001';
  get diagnostics v_rows_affected = row_count;
  assert v_rows_affected = 0, 'User B cannot update User A requirements';

  update public.properties set title = 'مخترق' where case_id = 'c0000000-0000-0000-0000-000000000001';
  get diagnostics v_rows_affected = row_count;
  assert v_rows_affected = 0, 'User B cannot update User A properties';

  -- Delete checks
  delete from public.properties where case_id = 'c0000000-0000-0000-0000-000000000001';
  get diagnostics v_rows_affected = row_count;
  assert v_rows_affected = 0, 'User B cannot delete User A properties';

  delete from public.requirements where case_id = 'c0000000-0000-0000-0000-000000000001';
  get diagnostics v_rows_affected = row_count;
  assert v_rows_affected = 0, 'User B cannot delete User A requirements';

  delete from public.decision_cases where id = 'c0000000-0000-0000-0000-000000000001';
  get diagnostics v_rows_affected = row_count;
  assert v_rows_affected = 0, 'User B cannot delete User A decision_cases';
end $$;

-- ============================================================================
-- Test E: A soft-deleted case (deleted_at set) is invisible to its owner
-- ============================================================================
-- Reset role to set deleted_at (simulate soft deletion)
reset role;
update public.decision_cases
set deleted_at = now()
where id = 'c0000000-0000-0000-0000-000000000001';

-- Switch to authenticated User A to test visibility
set role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', false);
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}', false);

-- Verify it is now invisible to User A
do $$
declare
  v_count int;
begin
  select count(*) into v_count from public.decision_cases where id = 'c0000000-0000-0000-0000-000000000001';
  assert v_count = 0, 'Soft-deleted case must be invisible to owner';

  select count(*) into v_count from public.requirements where case_id = 'c0000000-0000-0000-0000-000000000001';
  assert v_count = 0, 'Requirements of soft-deleted case must be invisible to owner';

  select count(*) into v_count from public.properties where case_id = 'c0000000-0000-0000-0000-000000000001';
  assert v_count = 0, 'Properties of soft-deleted case must be invisible to owner';
end $$;

rollback;
