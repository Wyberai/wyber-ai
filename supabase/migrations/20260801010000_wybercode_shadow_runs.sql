-- WyberCode shadow-mode comparison runs (self-hosted coding agent — see plan
-- Phase 5). Populated by src/lib/model-providers/shadow.ts's post-response
-- after() hook — replays a real Claude-served build through WyberCode with
-- zero user-facing impact, discards WyberCode's output, logs only
-- comparison metrics. No verbatim prompt/file content stored (prompt_hash
-- only) — this is internal eval, not long-term storage of user code.
create table if not exists public.wybercode_shadow_runs (
  id                         uuid primary key default uuid_generate_v4(),
  project_id                 uuid references public.projects(id) on delete set null,
  user_id                    uuid references public.profiles(id) on delete set null,
  prompt_hash                text not null,
  stage                      text not null,
  action_type                text not null,

  claude_files_written       int not null default 0,
  claude_build_succeeded     boolean,       -- reserved: not measured yet, see shadow.ts's known-gap comment
  claude_elapsed_ms          int,

  wybercode_files_written    int not null default 0,
  wybercode_build_succeeded  boolean,       -- reserved: not measured yet, see shadow.ts's known-gap comment
  wybercode_elapsed_ms       int,

  pages_from_template        int not null default 0,
  pages_full_gen             int not null default 0,
  -- Set when WyberCode's shadow run would have fallen back to Claude in real
  -- traffic (classifyWyberCodeFailure's reason, or a thrown-error class name).
  fallback_reason            text,

  created_at                 timestamptz not null default now()
);

alter table public.wybercode_shadow_runs enable row level security;
-- Service-role only (RLS on, no policies → anon/authenticated can't touch it).

create index if not exists idx_wybercode_shadow_runs_created_at on public.wybercode_shadow_runs(created_at);
create index if not exists idx_wybercode_shadow_runs_action_type on public.wybercode_shadow_runs(action_type);
create index if not exists idx_wybercode_shadow_runs_fallback_reason on public.wybercode_shadow_runs(fallback_reason);
