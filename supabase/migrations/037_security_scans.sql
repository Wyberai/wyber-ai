-- Security (RLS) scan history.
-- Each row is one live anon-probe scan of a project's connected Supabase: the
-- score, the findings, and how it was run. Lets us show a project's security
-- trend over time and prove "it was clean when you published" at publish time.
-- The scanner and publish gate write here best-effort (a missing table never
-- breaks a scan), so this migration is safe to apply at any point.

create table if not exists public.security_scans (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  score          int not null default 100,        -- 0-100, 100 = nothing exposed
  critical_count int not null default 0,           -- # of critical findings
  reachable      boolean not null default true,    -- did the anon key see any schema
  method         text,                             -- 'anon-probe' | 'anon-probe+mgmt'
  findings       jsonb not null default '[]'::jsonb,
  source         text not null default 'manual',   -- 'manual' | 'publish-gate'
  created_at     timestamptz not null default now()
);

alter table public.security_scans enable row level security;
create policy "users read own security scans"
  on public.security_scans for select
  using (auth.uid() = user_id);
create policy "users insert own security scans"
  on public.security_scans for insert
  with check (auth.uid() = user_id);

create index if not exists idx_security_scans_project
  on public.security_scans(project_id, created_at desc);
