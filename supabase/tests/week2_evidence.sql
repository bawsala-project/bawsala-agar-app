-- Test Suite: week2_evidence.sql
-- Acceptance Test for Week 2 Evidence Schema, RLS, and Triggers

begin;

-- Create test users in auth.users if not exist
insert into auth.users (id, aud, role, email)
values
  ('a0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'user_a@test.sa'),
  ('b0000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'user_b@test.sa')
on conflict (id) do nothing;

-- Clean prior test artifacts
delete from public.decision_cases where id = 'c0000000-0000-0000-0000-000000000002';

-- 1. Setup case and property as admin/service-role
insert into public.decision_cases (id, owner_id, city, status)
values ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'الرياض', 'draft');

insert into public.properties (id, case_id, input_mode, title)
values ('f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'manual', 'شقة تجريبية');

-- State version should be 2 (1 initial + 1 for property insert)
do $$
declare
  v_version int;
begin
  select state_version into v_version from public.decision_cases where id = 'c0000000-0000-0000-0000-000000000002';
  assert v_version = 2, 'state_version should be 2 after property insert';
end $$;

-- 2. Test trigger: inserting a property_fact increments parent case state_version
insert into public.property_facts (
  id,
  property_id,
  field,
  value,
  raw_text,
  scope,
  source
) values (
  'd0000000-0000-0000-0000-000000000001',
  'f0000000-0000-0000-0000-000000000001',
  'bedrooms',
  '4'::jsonb,
  '4 غرف',
  'unit',
  'url'
);

-- State version must now be 3 (incremented by trigger)
do $$
declare
  v_version int;
begin
  select state_version into v_version from public.decision_cases where id = 'c0000000-0000-0000-0000-000000000002';
  assert v_version = 3, 'state_version must increment after property_fact insert';
end $$;

-- 3. Test check constraint: unknown field key must be rejected
do $$
begin
  begin
    insert into public.property_facts (
      property_id,
      field,
      value,
      scope,
      source
    ) values (
      'f0000000-0000-0000-0000-000000000001',
      'unknown_field_key',
      '123'::jsonb,
      'unit',
      'url'
    );
    raise exception 'Check constraint failed: allowed unknown field key';
  exception
    when check_violation then
      -- expected check violation
      null;
  end;
end $$;

-- 4. Test RLS for Authenticated Owner (User A)
set role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

-- Owner CAN SELECT their facts
do $$
declare
  v_count int;
begin
  select count(*) into v_count from public.property_facts where property_id = 'f0000000-0000-0000-0000-000000000001';
  assert v_count = 1, 'Owner must be able to SELECT own property facts';
end $$;

-- Owner CANNOT INSERT facts (no insert policy)
do $$
begin
  begin
    insert into public.property_facts (
      property_id,
      field,
      value,
      scope,
      source
    ) values (
      'f0000000-0000-0000-0000-000000000001',
      'bathrooms',
      '2'::jsonb,
      'unit',
      'manual'
    );
    raise exception 'RLS failed: owner should not be allowed to INSERT facts directly';
  exception
    when insufficient_privilege then
      null;
  end;
end $$;

-- Owner CANNOT UPDATE facts (no update policy: affects 0 rows)
update public.property_facts set raw_text = 'tampered' where id = 'd0000000-0000-0000-0000-000000000001';
do $$
declare
  v_raw text;
begin
  select raw_text into v_raw from public.property_facts where id = 'd0000000-0000-0000-0000-000000000001';
  assert v_raw = '4 غرف', 'Owner should not be allowed to UPDATE facts (raw_text must remain unchanged)';
end $$;

-- Owner CANNOT DELETE facts (no delete policy: affects 0 rows)
delete from public.property_facts where id = 'd0000000-0000-0000-0000-000000000001';
do $$
declare
  v_count int;
begin
  select count(*) into v_count from public.property_facts where id = 'd0000000-0000-0000-0000-000000000001';
  assert v_count = 1, 'Owner should not be allowed to DELETE facts (fact must still exist)';
end $$;

-- 5. Test RLS Isolation: User B sees 0 rows
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000002","role":"authenticated"}', true);

do $$
declare
  v_count int;
begin
  select count(*) into v_count from public.property_facts where property_id = 'f0000000-0000-0000-0000-000000000001';
  assert v_count = 0, 'User B must see 0 rows for User A facts';
end $$;

-- Also test extraction_runs SELECT isolation
reset role;
insert into public.extraction_runs (id, property_id, status)
values ('e0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'succeeded');

set role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

do $$
declare
  v_count int;
begin
  select count(*) into v_count from public.extraction_runs where property_id = 'f0000000-0000-0000-0000-000000000001';
  assert v_count = 1, 'Owner must be able to SELECT own extraction runs';
end $$;

select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000002","role":"authenticated"}', true);

do $$
declare
  v_count int;
begin
  select count(*) into v_count from public.extraction_runs where property_id = 'f0000000-0000-0000-0000-000000000001';
  assert v_count = 0, 'User B must see 0 rows for User A extraction runs';
end $$;

rollback;
