-- Real per-generation token/cost usage — purely for calibrating the tiered
-- build pricing in src/lib/credits.ts (BUILD_TIER_COSTS/resolveBuildTier).
-- Today that pricing is a one-time estimate (see the comment above
-- BUILD_TIER_COSTS); this table is what turns it into a measured one. Never
-- read by creditCost() or any charging path — analytics only, populated by
-- src/app/api/generate/route.ts's post-response after() hook so it adds zero
-- latency to the build. Deliberately logs free passes too (self-heal, plan,
-- internal fill batches — credits_charged: 0) since those still cost real
-- Anthropic spend that today has zero visibility beyond a console.log line.
--
-- build_id groups every request that belongs to ONE staged build (the
-- charged scaffold pass plus every free fill batch it authorizes) under a
-- single client-generated id, so the overage safety valve (route.ts, fired
-- on the final pass) can sum real usage across the WHOLE build instead of
-- just the single request it happens to run in — a build split across many
-- individually-small fill passes can still add up to real money. A sentinel
-- row with action_type = 'build-overage' marks a build_id as already
-- charged, making that top-up idempotent against finalPass firing more than
-- once for the same build.
create table if not exists public.generation_usage_log (
  id                           uuid primary key default uuid_generate_v4(),
  user_id                      uuid references public.profiles(id) on delete set null,
  project_id                   uuid references public.projects(id) on delete set null,
  build_id                     text,
  action_type                  text not null,
  stage                        text not null,
  model_tier                   text not null,
  model_id                     text not null,
  input_tokens                 int not null default 0,
  output_tokens                int not null default 0,
  cache_creation_input_tokens  int not null default 0,
  cache_read_input_tokens      int not null default 0,
  cost_usd                     numeric(10,4),
  credits_charged              int not null default 0,
  build_tier                   text,
  planned_files                int,
  created_at                   timestamptz not null default now()
);

alter table public.generation_usage_log enable row level security;
-- Service-role only (RLS on, no policies → anon/authenticated can't touch it).

create index if not exists idx_generation_usage_log_created_at  on public.generation_usage_log(created_at);
create index if not exists idx_generation_usage_log_action_type on public.generation_usage_log(action_type);
create index if not exists idx_generation_usage_log_build_tier  on public.generation_usage_log(build_tier);
create index if not exists idx_generation_usage_log_user        on public.generation_usage_log(user_id);
create index if not exists idx_generation_usage_log_build_id    on public.generation_usage_log(build_id);
