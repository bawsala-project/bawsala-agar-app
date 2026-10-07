-- Migration: 20261008110000_week4_payment_states.sql
-- Week 4: abandoned / duplicate_paid payment states and single-paid-per-case guarantee

alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments
  add constraint payments_status_check
  check (status in ('initiated', 'paid', 'failed', 'refunded', 'abandoned', 'duplicate_paid'));

-- A case can have at most one paid payment, even under concurrent callbacks.
create unique index if not exists uq_payments_one_paid_per_case
  on public.payments(case_id)
  where status = 'paid';
