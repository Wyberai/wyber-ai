-- ============================================================
-- Migration 003: Missing tables for agents, flows, credit
--   tracking, project connectors, and profiles columns
-- ============================================================

-- ── PROFILES: add missing columns ────────────────────────────
alter table public.profiles
  add column if not exists daily_credits      int  not null default 3,
  add column if not exists topup_credits      int  not null default 0,
  add column if not exists subscription_status text not null default 'active',
  add column if not exists onboarded          boolean not null default false;

-- ── AGENT_WORKFLOWS ──────────────────────────────────────────
-- Gallery of pre-built agent definitions (seeded, not user-owned)
create table if not exists public.agent_workflows (
  id             uuid primary key default uuid_generate_v4(),
  agent_id       text unique not null,   -- stable slug, e.g. "lead-researcher"
  name           text not null,
  description    text,
  category       text,                   -- e.g. "Sales", "Research", "Support"
  required_tools text[] default '{}',
  system_prompt  text,
  tools          jsonb default '[]',
  tags           text[] default '{}',
  icon           text,
  outcome        text,
  problem        text,
  primary_buyer  text,
  created_at     timestamptz default now()
);

-- Anyone can read gallery agents; only service-role can write
alter table public.agent_workflows enable row level security;
create policy "public read agent_workflows"
  on public.agent_workflows for select using (true);

-- ── AGENT_EXECUTIONS ─────────────────────────────────────────
create table if not exists public.agent_executions (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  project_id     uuid references public.projects(id) on delete set null,
  agent_id       text not null,
  status         text not null default 'running', -- running | completed | failed
  input          jsonb default '{}',
  output         jsonb,
  logs           jsonb default '[]',
  steps          int  not null default 0,
  credits_used   int  not null default 0,
  error          text,
  triggered_by   text default 'manual',
  started_at     timestamptz default now(),
  completed_at   timestamptz
);

alter table public.agent_executions enable row level security;
create policy "users see own agent_executions"
  on public.agent_executions for all
  using (auth.uid() = user_id);

-- ── PROJECT_CONNECTORS ───────────────────────────────────────
-- Encrypted tool credentials per project (Supabase, Stripe, etc.)
create table if not exists public.project_connectors (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  project_id     uuid references public.projects(id) on delete cascade,
  service        text not null,   -- 'supabase' | 'stripe' | 'resend' | composio slug
  api_key        text,            -- encrypted primary credential (e.g. Supabase anon key)
  config         jsonb not null default '{}', -- additional config (e.g. { url: '...' })
  connection_id  text,            -- Composio connection ID if applicable
  connected_at   timestamptz,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique (project_id, service)       -- matches upsert onConflict in connectors route
);

alter table public.project_connectors enable row level security;
create policy "users manage own project_connectors"
  on public.project_connectors for all
  using (auth.uid() = user_id);

-- ── CREDIT_USAGE ─────────────────────────────────────────────
create table if not exists public.credit_usage (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  project_id     uuid references public.projects(id) on delete set null,
  amount         int  not null,                  -- negative = consumed
  reason         text not null,                  -- 'generation' | 'agent-execution' | 'canvas-run'
  credits_before int  not null default 0,
  credits_after  int  not null default 0,
  created_at     timestamptz default now()
);

alter table public.credit_usage enable row level security;
create policy "users see own credit_usage"
  on public.credit_usage for select
  using (auth.uid() = user_id);

-- Service role inserts only (app writes via admin client)
create policy "service role insert credit_usage"
  on public.credit_usage for insert
  with check (true);

-- ── FLOWS ────────────────────────────────────────────────────
create table if not exists public.flows (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  name           text not null default 'Untitled Workflow',
  description    text,
  nodes          jsonb not null default '[]',
  edges          jsonb not null default '[]',
  is_active      boolean not null default false,
  run_count      int  not null default 0,
  last_run_at    timestamptz,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

alter table public.flows enable row level security;
create policy "users manage own flows"
  on public.flows for all
  using (auth.uid() = user_id);

-- RPC used by canvas/run route after each execution
create or replace function public.increment_flow_run_count(flow_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.flows
  set run_count = run_count + 1, last_run_at = now()
  where id = flow_id;
end;
$$;

-- ── PREBUILT_APPS ────────────────────────────────────────────
create table if not exists public.prebuilt_apps (
  id             uuid primary key default uuid_generate_v4(),
  slug           text unique not null,
  name           text not null,
  description    text,
  category       text,
  tags           text[] default '{}',
  files          jsonb not null default '{}', -- { "App.tsx": "...", "index.css": "..." }
  framework      text not null default 'react-vite',
  is_published   boolean not null default true,
  use_count      int  not null default 0,
  created_at     timestamptz default now()
);

alter table public.prebuilt_apps enable row level security;
create policy "public read prebuilt_apps"
  on public.prebuilt_apps for select using (is_published = true);

-- ── USER_SECRETS ─────────────────────────────────────────────
-- Encrypted user-level secrets (API keys, tokens — not project-scoped)
create table if not exists public.user_secrets (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  name            text not null,          -- normalized UPPER_SNAKE_CASE key
  value_encrypted text not null,          -- AES-256-GCM encrypted at app layer
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (user_id, name)
);

alter table public.user_secrets enable row level security;
create policy "users manage own user_secrets"
  on public.user_secrets for all
  using (auth.uid() = user_id);

-- ── PROJECT_ENVIRONMENTS ─────────────────────────────────────
-- Deployment environments per project (e.g. 'live', 'staging')
-- Each row is a snapshot of the project files at the time of promotion
create table if not exists public.project_environments (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  project_id     uuid not null references public.projects(id) on delete cascade,
  name           text not null,           -- 'live' | 'staging' | custom
  files_snapshot jsonb,                   -- project files at promotion time
  status         text not null default 'live',
  promoted_at    timestamptz,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique (project_id, name)              -- matches upsert onConflict in environments route
);

alter table public.project_environments enable row level security;
create policy "users manage own project_environments"
  on public.project_environments for all
  using (auth.uid() = user_id);

-- ── INDEXES ──────────────────────────────────────────────────
create index if not exists idx_agent_executions_user   on public.agent_executions(user_id);
create index if not exists idx_agent_executions_project on public.agent_executions(project_id);
create index if not exists idx_credit_usage_user        on public.credit_usage(user_id);
create index if not exists idx_flows_user               on public.flows(user_id);
create index if not exists idx_project_connectors_proj  on public.project_connectors(project_id);
create index if not exists idx_user_secrets_user        on public.user_secrets(user_id);
create index if not exists idx_project_envs_proj        on public.project_environments(project_id);
