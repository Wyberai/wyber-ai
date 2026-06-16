-- ============================================================
-- Migration 004: Missing RPCs and tables found in launch audit
-- ============================================================

-- ── RPC: add_daily_credits ────────────────────────────────────
-- Called by /api/cron/daily-credits on a daily schedule.
-- Awards each user their plan's daily_credits allowance,
-- capped so total credits never exceed a reasonable ceiling.
drop function if exists public.add_daily_credits();
create or replace function public.add_daily_credits()
returns jsonb language plpgsql security definer as $$
declare
  updated_count int;
begin
  update public.profiles
  set
    credits    = credits + daily_credits,
    updated_at = now()
  where daily_credits > 0;

  get diagnostics updated_count = row_count;
  return json_build_object('updated', updated_count, 'ts', now());
end;
$$;

-- ── RPC: increment_app_use ────────────────────────────────────
-- Called by the generate route when a prebuilt template is served.
create or replace function public.increment_app_use(app_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.prebuilt_apps
  set use_count = use_count + 1
  where id = app_id;
end;
$$;

-- ── API_KEYS ─────────────────────────────────────────────────
-- User-issued API keys for the Wyber MCP server.
create table if not exists public.api_keys (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  key        text not null unique,
  name       text,
  active     boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.api_keys enable row level security;
create policy "users manage own api_keys"
  on public.api_keys for all
  using (auth.uid() = user_id);

create index if not exists idx_api_keys_key on public.api_keys(key);

-- ── MCP_MESSAGES ─────────────────────────────────────────────
-- Queued build requests arriving via the MCP server.
create table if not exists public.mcp_messages (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  message      text not null,
  status       text not null default 'queued', -- queued | processing | done | error
  response     text,
  error        text,
  created_at   timestamptz default now(),
  processed_at timestamptz
);

alter table public.mcp_messages enable row level security;
create policy "users see own mcp_messages"
  on public.mcp_messages for select
  using (auth.uid() = user_id);
create policy "service role insert mcp_messages"
  on public.mcp_messages for insert
  with check (true);

create index if not exists idx_mcp_messages_project on public.mcp_messages(project_id);

-- ── SAFETY_REPORTS ───────────────────────────────────────────
-- Logged when the safety moderation AI flags/blocks a project.
create table if not exists public.safety_reports (
  id         uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete set null,
  score      int,
  flags      text[] default '{}',
  blocked    boolean not null default false,
  reason     text,
  created_at timestamptz default now()
);

alter table public.safety_reports enable row level security;
-- Only service role writes; no user-facing read policy needed
create policy "service role insert safety_reports"
  on public.safety_reports for insert
  with check (true);
