-- Company agents (see src/lib/ops/agents). Agents PREPARE work (message drafts,
-- meeting briefs, proposal outlines, a weekly pipeline read); a human approves
-- and sends. Nothing here sends anything. Service-role only (RLS on, no policies).
create table if not exists ops_agent_drafts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  agent text not null check (agent in ('outreach', 'followup', 'meeting_prep', 'proposal', 'weekly_coach')),
  contact_id uuid references crm_contacts(id) on delete cascade,   -- null for the weekly coach
  dedupe_key text not null,              -- stops the same agent drafting the same thing twice
  channel text not null check (channel in ('whatsapp', 'email', 'note', 'doc')),
  lang text not null default 'en' check (lang in ('en', 'hi', 'gu')),
  title text,
  body text not null,
  meta jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'sent', 'rejected', 'expired')),
  reject_reason text,
  edited boolean not null default false,
  model text,
  run_id uuid
);
-- NULLs are distinct in a plain unique index, so the weekly coach (no contact) gets its own.
create unique index if not exists uq_ops_drafts_contact on ops_agent_drafts (agent, contact_id, dedupe_key) where contact_id is not null;
create unique index if not exists uq_ops_drafts_global on ops_agent_drafts (agent, dedupe_key) where contact_id is null;
create index if not exists idx_ops_drafts_status on ops_agent_drafts (status, created_at desc);
alter table ops_agent_drafts enable row level security;

create table if not exists ops_agent_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  agent text not null,
  considered int not null default 0,
  created int not null default 0,
  skipped int not null default 0,
  errors int not null default 0,
  note text,
  model text,
  input_tokens int not null default 0,
  output_tokens int not null default 0
);
create index if not exists idx_ops_runs_agent on ops_agent_runs (agent, started_at desc);
alter table ops_agent_runs enable row level security;

create table if not exists ops_agent_settings (
  agent text primary key,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table ops_agent_settings enable row level security;
