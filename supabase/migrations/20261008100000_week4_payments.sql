-- Migration: 20261008100000_week4_payments.sql
-- Week 4: Payments and expected-effect operation tracking

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.decision_cases(id) on delete cascade,
  provider text not null check (provider in ('mock', 'moyasar', 'tap')),
  amount_sar numeric(10,2) not null check (amount_sar = 10.00),
  currency text not null default 'SAR' check (currency = 'SAR'),
  status text not null default 'initiated' check (status in ('initiated', 'paid', 'failed', 'refunded')),
  idempotency_key text not null unique,
  provider_event_id text unique,
  external_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_case_id on public.payments(case_id);
create index if not exists idx_payments_idempotency_key on public.payments(idempotency_key);

create trigger set_updated_at_payments
before update on public.payments
for each row execute function public.handle_updated_at();

alter table public.payments enable row level security;

drop policy if exists "Users can select own payments" on public.payments;
create policy "Users can select own payments"
on public.payments for select
to authenticated
using (
  exists (
    select 1 from public.decision_cases c
    where c.id = payments.case_id
      and c.owner_id = auth.uid()
      and c.deleted_at is null
  )
);

create table if not exists public.case_operations (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.decision_cases(id) on delete cascade,
  operation_type text not null check (operation_type in ('checkout', 'analyze', 'reassess')),
  idempotency_key text not null unique,
  expected_effect jsonb not null,
  actual_effect jsonb,
  effect_status text not null default 'pending' check (effect_status in ('pending', 'matched', 'mismatch')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- No user policies: accessible through the admin client only.
alter table public.case_operations enable row level security;
