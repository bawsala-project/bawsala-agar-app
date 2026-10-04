-- Migration: week1_schema.sql

-- 1. Table: decision_cases
create table if not exists public.decision_cases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  city text not null,
  status text not null default 'draft' check (status in ('draft', 'needs_complete', 'properties_complete')),
  state_version integer not null default 1,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Table: requirements (exactly one per case)
create table if not exists public.requirements (
  case_id uuid primary key references public.decision_cases(id) on delete cascade,
  max_budget_sar numeric(12,2) not null check (max_budget_sar > 0),
  purchase_method text not null check (purchase_method in ('cash', 'finance', 'undecided')),
  household_size smallint not null check (household_size between 1 and 20),
  min_bedrooms smallint not null check (min_bedrooms between 1 and 10),
  min_area_sqm numeric(7,2) check (min_area_sqm > 0),
  hard_constraints jsonb not null default '[]'::jsonb,
  preferences jsonb not null default '[]'::jsonb,
  important_locations jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- 3. Table: properties
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.decision_cases(id) on delete cascade,
  input_mode text not null check (input_mode in ('url', 'image', 'manual')),
  source_url text,
  image_paths text[] not null default '{}'::text[],
  title text,
  district text,
  listing_price_sar numeric(12,2) check (listing_price_sar > 0),
  area_sqm numeric(7,2) check (area_sqm > 0),
  bedrooms smallint,
  floor_no smallint,
  notes text,
  created_at timestamptz not null default now(),
  unique (case_id, source_url)
);

-- Indexes
create index if not exists idx_decision_cases_owner_id on public.decision_cases(owner_id);
create index if not exists idx_properties_case_id on public.properties(case_id);

-- Trigger: Keep updated_at current
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_decision_cases
before update on public.decision_cases
for each row execute function public.handle_updated_at();

create trigger set_updated_at_requirements
before update on public.requirements
for each row execute function public.handle_updated_at();

-- Trigger: Enforce max 5 properties per case
create or replace function public.check_property_limit()
returns trigger as $$
declare
  property_count integer;
begin
  select count(*) into property_count
  from public.properties
  where case_id = new.case_id;

  if property_count >= 5 then
    raise exception 'Cannot add more than 5 properties to a case';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger enforce_property_limit
before insert on public.properties
for each row execute function public.check_property_limit();

-- Trigger: Increment state_version on requirements or properties change
create or replace function public.increment_case_state_version()
returns trigger as $$
declare
  target_case_id uuid;
begin
  if (tg_op = 'DELETE') then
    target_case_id := old.case_id;
  else
    target_case_id := new.case_id;
  end if;

  update public.decision_cases
  set state_version = state_version + 1,
      updated_at = now()
  where id = target_case_id;

  if (tg_op = 'DELETE') then
    return old;
  else
    return new;
  end if;
end;
$$ language plpgsql security definer;

create trigger trigger_state_version_requirements
after insert or update or delete on public.requirements
for each row execute function public.increment_case_state_version();

create trigger trigger_state_version_properties
after insert or update or delete on public.properties
for each row execute function public.increment_case_state_version();

-- RLS: decision_cases
alter table public.decision_cases enable row level security;

create policy "Users can select own active cases"
on public.decision_cases for select
to authenticated
using (owner_id = auth.uid() and deleted_at is null);

create policy "Users can insert own cases"
on public.decision_cases for insert
to authenticated
with check (owner_id = auth.uid() and deleted_at is null);

create policy "Users can update own active cases"
on public.decision_cases for update
to authenticated
using (owner_id = auth.uid() and deleted_at is null)
with check (owner_id = auth.uid() and deleted_at is null);

create policy "Users can delete own active cases"
on public.decision_cases for delete
to authenticated
using (owner_id = auth.uid() and deleted_at is null);

-- RLS: requirements
alter table public.requirements enable row level security;

create policy "Users can select own requirements"
on public.requirements for select
to authenticated
using (
  exists (
    select 1 from public.decision_cases c
    where c.id = requirements.case_id
      and c.owner_id = auth.uid()
      and c.deleted_at is null
  )
);

create policy "Users can insert own requirements"
on public.requirements for insert
to authenticated
with check (
  exists (
    select 1 from public.decision_cases c
    where c.id = requirements.case_id
      and c.owner_id = auth.uid()
      and c.deleted_at is null
  )
);

create policy "Users can update own requirements"
on public.requirements for update
to authenticated
using (
  exists (
    select 1 from public.decision_cases c
    where c.id = requirements.case_id
      and c.owner_id = auth.uid()
      and c.deleted_at is null
  )
)
with check (
  exists (
    select 1 from public.decision_cases c
    where c.id = requirements.case_id
      and c.owner_id = auth.uid()
      and c.deleted_at is null
  )
);

create policy "Users can delete own requirements"
on public.requirements for delete
to authenticated
using (
  exists (
    select 1 from public.decision_cases c
    where c.id = requirements.case_id
      and c.owner_id = auth.uid()
      and c.deleted_at is null
  )
);

-- RLS: properties
alter table public.properties enable row level security;

create policy "Users can select own properties"
on public.properties for select
to authenticated
using (
  exists (
    select 1 from public.decision_cases c
    where c.id = properties.case_id
      and c.owner_id = auth.uid()
      and c.deleted_at is null
  )
);

create policy "Users can insert own properties"
on public.properties for insert
to authenticated
with check (
  exists (
    select 1 from public.decision_cases c
    where c.id = properties.case_id
      and c.owner_id = auth.uid()
      and c.deleted_at is null
  )
);

create policy "Users can update own properties"
on public.properties for update
to authenticated
using (
  exists (
    select 1 from public.decision_cases c
    where c.id = properties.case_id
      and c.owner_id = auth.uid()
      and c.deleted_at is null
  )
)
with check (
  exists (
    select 1 from public.decision_cases c
    where c.id = properties.case_id
      and c.owner_id = auth.uid()
      and c.deleted_at is null
  )
);

create policy "Users can delete own properties"
on public.properties for delete
to authenticated
using (
  exists (
    select 1 from public.decision_cases c
    where c.id = properties.case_id
      and c.owner_id = auth.uid()
      and c.deleted_at is null
  )
);

-- Storage bucket: property-images
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', false)
on conflict (id) do nothing;

create policy "Users can read own property images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'property-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can upload own property images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'property-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update own property images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'property-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'property-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own property images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'property-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Function: Soft delete a decision case
create or replace function public.delete_case(case_id uuid)
returns void as $$
begin
  update public.decision_cases
  set deleted_at = now()
  where id = case_id
    and owner_id = auth.uid()
    and deleted_at is null;
end;
$$ language plpgsql security definer;

grant execute on function public.delete_case(uuid) to authenticated;
