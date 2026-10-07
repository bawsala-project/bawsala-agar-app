-- Migration: 20261007090000_week3_inspection.sql
-- Week 3 Phase 3: On-site Inspection Checklist Items

create table if not exists public.inspection_items (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  category text not null check (category in ('building_services', 'unit_specs', 'parking_access', 'neighborhood')),
  question_ar text not null,
  why_it_matters_ar text not null,
  how_to_check_ar text not null,
  priority text not null check (priority in ('high', 'medium', 'low')),
  trigger_reason text not null check (trigger_reason in ('unknown_fact', 'conflict', 'detected_risk', 'constraint_verification')),
  affected_assessment_types text[] not null check (cardinality(affected_assessment_types) > 0),
  created_at timestamptz not null default now(),
  unique (property_id, question_ar)
);

create index if not exists idx_inspection_items_property_id
  on public.inspection_items (property_id);

-- RLS: owner SELECT only on inspection_items. No public insert/update/delete.
alter table public.inspection_items enable row level security;

drop policy if exists "Users can select own inspection items" on public.inspection_items;
create policy "Users can select own inspection items"
on public.inspection_items for select
to authenticated
using (
  exists (
    select 1 from public.properties p
    join public.decision_cases c on c.id = p.case_id
    where p.id = inspection_items.property_id
      and c.owner_id = auth.uid()
      and c.deleted_at is null
  )
);
