-- ============================================================
-- Migration: 2FA recovery codes + mfa_enabled flag
-- ============================================================
-- Supabase Auth MFA is TOTP-only with no built-in backup codes, so we issue our
-- own single-use recovery codes (stored hashed) that let a user who lost their
-- authenticator regain access. The mfa_enabled flag lets middleware cheaply know
-- a user has 2FA on without an MFA API call on every request.

alter table public.profiles add column if not exists mfa_enabled boolean not null default false;

create table if not exists public.mfa_recovery_codes (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  code_hash  text not null,           -- sha256(normalized code)
  used_at    timestamptz,             -- null = still usable (single-use)
  created_at timestamptz not null default now()
);

create index if not exists idx_mfa_recovery_user on public.mfa_recovery_codes(user_id);

-- Service-role only (all access via the /api/mfa routes' service client).
alter table public.mfa_recovery_codes enable row level security;
