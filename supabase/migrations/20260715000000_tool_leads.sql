-- Inbound leads captured from the free public scanners at /tools.
-- Anonymous visitors who run a security or SEO scan and ask for the full report
-- by email. These are NOT owner-scoped like gtm_leads (which require a user_id
-- and RLS-restrict to that owner) — they are inbound marketing captures the
-- founder follows up on. Service-role writes; admin reads via the service client.
create table if not exists tool_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  tool text not null,              -- 'security' | 'seo'
  target_url text,                 -- what they scanned
  target_domain text,              -- normalized host
  score int,                       -- 0-100 result score
  findings_count int default 0,    -- leaks / failed checks
  top_severity text,               -- critical | high | medium | low | good
  intent_tag text,                 -- e.g. 'security_at_risk' | 'seo_needs_work'
  ip_hash text,                    -- hashed IP for dedup/abuse, never raw PII
  user_agent text,
  emailed boolean default false,   -- did we send them the report
  status text default 'new',       -- new | contacted | converted
  created_at timestamptz default now()
);

create index if not exists idx_tool_leads_created on tool_leads(created_at desc);
create index if not exists idx_tool_leads_email on tool_leads(email);

alter table tool_leads enable row level security;
-- No public policy on purpose: only the service role (server) reads/writes.
-- Admin surfaces use the service client, which bypasses RLS.
