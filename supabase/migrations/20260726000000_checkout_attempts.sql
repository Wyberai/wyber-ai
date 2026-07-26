-- Cart-abandonment tracking for checkout: /api/dodo/checkout logs a row the
-- moment a Dodo checkout session is created; the webhook marks it converted
-- on payment.succeeded/subscription.active. The daily email-drip cron nudges
-- anyone with an unconverted attempt 1-24h old exactly once.
--
-- ⚠ MUST BE RUN MANUALLY in the Supabase dashboard SQL editor (the CLI on the
-- dev machine is linked to a different Supabase account) — same as
-- 20260703110000_email_drip.sql.

create table if not exists checkout_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_key text not null,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  converted boolean not null default false,
  converted_at timestamptz
);

create index if not exists checkout_attempts_user_id_idx on checkout_attempts (user_id);
create index if not exists checkout_attempts_pending_idx on checkout_attempts (created_at) where converted = false;

-- Service-role only (RLS on, no policies) — same posture as email_events.
alter table checkout_attempts enable row level security;
