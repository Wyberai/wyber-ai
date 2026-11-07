-- Visitor-intent experiment (India-only, see src/lib/intent). Anonymous by
-- design: rows carry a random per-browser id, never an email or account.
-- Written only by /api/intent and /api/intent/event with the service role.
--
-- text_redacted holds what the visitor typed AFTER emails and long digit runs
-- were replaced (max 400 chars). It is personal-adjacent data under India's
-- DPDP Act, so keep it short-lived: run the prune below on a schedule
-- (or by hand) to drop rows older than 90 days.
--   delete from intent_events where created_at < now() - interval '90 days';
create table if not exists intent_events (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  anon_id text not null,
  variant text not null check (variant in ('intent', 'control')),
  kind text not null,
  lang text,
  door text,
  chip_id text,
  text_redacted text,
  intent jsonb,
  prior jsonb,
  country text,
  region text
);
create index if not exists idx_intent_events_kind_time on intent_events (kind, created_at desc);
create index if not exists idx_intent_events_anon on intent_events (anon_id, created_at desc);
alter table intent_events enable row level security;
