-- Self-serve affiliate program: separate approval gate + cash-commission
-- ledger, layered on top of the existing (unmodified) free-credit referral
-- loop in profiles.referred_by / referral_code / REFERRAL_LIMIT (see
-- src/lib/referral.ts). Approval is required before any commission accrues
-- — reusing referred_by directly for cash would extend the exact farming
-- vector fixed in commit 389be52 (new-account credit farming) to real
-- money. See src/lib/affiliate.ts for the accrual/reversal logic and
-- src/app/api/dodo/webhook/route.ts for where it's hooked in.

create table if not exists public.affiliates (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null unique references public.profiles(id) on delete cascade,
  status         text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  payout_email   text,
  payout_method  text,
  applied_at     timestamptz not null default now(),
  approved_at    timestamptz,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.affiliates enable row level security;

-- Read-only for the affiliate themselves. No insert/update policy: applying
-- and approving both go through service-role API routes (validated there),
-- same posture as preview_comments' anonymous writes.
create policy "user can view own affiliate row"
  on public.affiliates for select
  using (auth.uid() = user_id);

create table if not exists public.affiliate_commissions (
  id                uuid primary key default gen_random_uuid(),
  affiliate_id      uuid not null references public.affiliates(id) on delete cascade,
  referred_user_id  uuid references public.profiles(id) on delete set null,
  dodo_event_type   text not null,
  dodo_payment_id   text,
  plan_key          text,
  charge_usd        numeric(10,2) not null,
  commission_rate   numeric(4,3) not null default 0.30,
  commission_usd    numeric(10,2) not null,
  status            text not null default 'pending' check (status in ('pending','paid','reversed')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- A payment id must never generate two commission rows even on a dedupe gap
-- upstream — the primary defense is processed_webhooks in the Dodo webhook,
-- this is a second, independent safety net.
create unique index if not exists affiliate_commissions_payment_uniq
  on public.affiliate_commissions(dodo_payment_id) where dodo_payment_id is not null;

create index if not exists idx_affiliate_commissions_affiliate on public.affiliate_commissions(affiliate_id, created_at desc);

alter table public.affiliate_commissions enable row level security;

create policy "affiliate can view own commissions"
  on public.affiliate_commissions for select
  using (exists (select 1 from public.affiliates where id = affiliate_id and user_id = auth.uid()));

-- Denormalized fast-read balances, credited/paid by the webhook and admin
-- routes — same accrual shape as profiles.pending_earnings_usd for
-- marketplace sellers (20260724000000_marketplace.sql).
alter table public.profiles add column if not exists affiliate_pending_usd numeric(10,2) not null default 0;
alter table public.profiles add column if not exists affiliate_paid_usd numeric(10,2) not null default 0;
