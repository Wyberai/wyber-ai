-- Unified growth signal ledger: every reason a person is worth reaching, from
-- any source, ranked and tracked in one place instead of four disconnected
-- spreadsheets. Sources: organic social intent (Reddit/HN complaints about
-- competitors or app-building struggles), our own Smartlead outreach
-- (opens/completions on past campaigns), and product-side "stuck" signals
-- (signed up, started building, never shipped or ran low on credits) drawn
-- from our own profiles/projects tables — never anonymous web traffic.
--
-- The recommended_action + drafted_response fields let the daily brief pull
-- a ready-to-execute plan straight from this table instead of regenerating
-- content from scratch each morning. utm_campaign + converted_at close the
-- loop: did this specific signal's action actually produce a signup.
create table if not exists growth_signals (
  id uuid primary key default gen_random_uuid(),

  -- Where this signal came from.
  source text not null check (source in ('social_intent', 'smartlead_outreach', 'product_stuck', 'other')),
  channel text,                     -- 'reddit' | 'hackernews' | 'x' | 'email' | 'product' | ...

  -- Who it's about. person_identifier is whatever uniquely names them for
  -- this source (an email, a Reddit username, a profile id) — intentionally
  -- loose since sources differ wildly in what identity they carry.
  person_identifier text not null,
  person_name text,
  company text,
  source_url text,                  -- the Reddit thread, the campaign record, etc.

  -- What was actually detected, in plain language, so a human reviewing the
  -- queue doesn't have to open the source to understand why this is here.
  signal_detail text not null,

  -- Scoring + routing.
  intent_score int not null default 0 check (intent_score between 0 and 100),
  segment text not null check (segment in (
    'organic_high_intent',   -- someone actively complaining/asking, right now
    'warm_reengage',         -- opened/engaged with past outreach
    'stuck_rescue',          -- signed up, built something, stalled or low credits
    'cold_dfy'               -- cold list, no engagement yet, candidate for a personalized demo
  )),
  recommended_action text not null,
  drafted_response text,

  -- Lifecycle.
  status text not null default 'new' check (status in ('new', 'queued', 'actioned', 'dismissed', 'converted')),
  detected_at timestamptz not null default now(),
  actioned_at timestamptz,

  -- Attribution — the piece that closes the loop.
  utm_campaign text,
  converted_at timestamptz,

  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_growth_signals_status on growth_signals(status);
create index if not exists idx_growth_signals_segment on growth_signals(segment);
create index if not exists idx_growth_signals_detected on growth_signals(detected_at desc);
create index if not exists idx_growth_signals_score on growth_signals(intent_score desc);
-- One signal per (source, person, source_url) — reruns of the scanners/imports don't duplicate rows.
create unique index if not exists idx_growth_signals_dedupe on growth_signals(source, person_identifier, coalesce(source_url, ''));

alter table growth_signals enable row level security;
-- No public policy on purpose: this is founder-internal tooling, not
-- user-facing data. Only the service role (server-side scripts/scheduled
-- task) reads or writes it.
