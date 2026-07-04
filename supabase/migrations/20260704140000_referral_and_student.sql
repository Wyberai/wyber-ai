-- Referral program + student flag — the columns the code already reads/writes
-- were never added, so the referral perk was fully dead (the card's GET errored
-- and hid it) and the .edu student bonus silently no-op'd.
--
-- Idempotent: safe to run on prod even if some columns already exist.

alter table profiles
  add column if not exists is_student              boolean not null default false,
  add column if not exists referral_code           text,
  add column if not exists referred_by             uuid references auth.users(id) on delete set null,
  add column if not exists referral_count          integer not null default 0,
  add column if not exists referral_credits_earned integer not null default 0;

-- One account per referral code. Partial (WHERE not null) so the many rows that
-- don't have a code yet don't collide on NULL.
create unique index if not exists profiles_referral_code_uniq
  on profiles (referral_code) where referral_code is not null;

-- Fast referrer lookup at redeem time (by code) and stats (by who referred you).
create index if not exists profiles_referred_by_idx on profiles (referred_by);
