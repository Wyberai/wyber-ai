-- Launch-readiness scan history — sibling to security_scans (037_security_scans.sql).
-- WyberAi's published apps are client-rendered React bundles served from a single
-- srcDoc iframe (src/app/app/[slug]/page.tsx) — there is no server route for
-- "/privacy" or "/terms" to crawl, and body content never appears in a raw HTTP
-- fetch. So this scan reads the project's OWN source directly instead of
-- live-crawling: for a deterministic CSR app the shipped text IS what will
-- render, so pattern-matching it is ground truth, not a guess. Advisory only —
-- never gates publish, since content heuristics carry real false-positive risk
-- (unlike the proven-leak RLS gate).

create table if not exists public.launch_readiness_scans (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  score          int not null default 100,        -- 0-100
  critical_count int not null default 0,
  checks         jsonb not null default '[]'::jsonb,
  source         text not null default 'manual',  -- 'manual' | 'publish-gate' (reserved for future use)
  created_at     timestamptz not null default now()
);

alter table public.launch_readiness_scans enable row level security;
create policy "users read own launch readiness scans"
  on public.launch_readiness_scans for select
  using (auth.uid() = user_id);
create policy "users insert own launch readiness scans"
  on public.launch_readiness_scans for insert
  with check (auth.uid() = user_id);

create index if not exists idx_launch_readiness_scans_project
  on public.launch_readiness_scans(project_id, created_at desc);
