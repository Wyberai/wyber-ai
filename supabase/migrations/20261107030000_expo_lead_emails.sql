-- Expo lead email sequence (see src/lib/expo-sequence.ts).
-- email_opt_out: set by the signed unsubscribe link.
-- expo_lead_emails: one row per (lead, kind) already claimed/sent. The unique
-- constraint is the lock that stops a double cron run or a form-submit racing
-- the cron from sending the same email twice.
alter table expo_leads add column if not exists email_opt_out boolean not null default false;

create table if not exists expo_lead_emails (
  id bigserial primary key,
  lead_id uuid not null references expo_leads(id) on delete cascade,
  kind text not null check (kind in ('confirmation','reminder','thanks','followup')),
  sent_at timestamptz not null default now(),
  unique (lead_id, kind)
);
alter table expo_lead_emails enable row level security;
