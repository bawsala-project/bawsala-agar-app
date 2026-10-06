-- Migration: replace_extracted_facts function
-- Executable by service_role only

create or replace function public.replace_extracted_facts(
  p_run_id uuid,
  p_facts jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_property_id uuid;
begin
  -- 1. Find property_id from extraction_runs
  select property_id into v_property_id
  from public.extraction_runs
  where id = p_run_id;

  if v_property_id is null then
    raise exception 'extraction run % not found', p_run_id;
  end if;

  -- 2. Delete previous url/image facts for this property
  -- Note: user_correction and manual facts are never deleted
  delete from public.property_facts
  where property_id = v_property_id
    and source in ('url', 'image');

  -- 3. Insert new facts if any
  if p_facts is not null and jsonb_array_length(p_facts) > 0 then
    insert into public.property_facts (
      property_id,
      extraction_run_id,
      field,
      value,
      raw_text,
      scope,
      source,
      evidence_text,
      evidence_verified
    )
    select
      v_property_id,
      p_run_id,
      f->>'field',
      f->'value',
      f->>'raw_text',
      coalesce(f->>'scope', 'unit'),
      coalesce(f->>'source', 'url'),
      f->>'evidence_text',
      coalesce((f->>'evidence_verified')::boolean, false)
    from jsonb_array_elements(p_facts) as f;
  end if;

  -- 4. Mark run succeeded
  update public.extraction_runs
  set status = 'succeeded',
      finished_at = now()
  where id = p_run_id;
end;
$$;

revoke all on function public.replace_extracted_facts(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.replace_extracted_facts(uuid, jsonb) to service_role;
