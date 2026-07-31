-- Mobile/QR preview credit gating (see /api/preview-access). Every viewer who
-- opens a project's preview costs the project OWNER credits once per calendar
-- day (2cr app / 5cr game) — the owner previewing their own project is free
-- and never inserts a row here.
create table if not exists preview_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  viewer_id uuid not null references auth.users(id) on delete cascade,
  credits_charged int not null default 0,
  is_game boolean not null default false,
  -- Explicit calendar-day column (UTC) rather than date_trunc(expires_at) —
  -- expires_at is a rolling now()+24h value, not aligned to day boundaries,
  -- so truncating it wouldn't reliably give "once per calendar day" semantics.
  access_date date not null default (timezone('utc', now()))::date,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (project_id, viewer_id, access_date)
);

create index if not exists preview_sessions_project_id_idx on preview_sessions(project_id);
create index if not exists preview_sessions_owner_lookup_idx on preview_sessions(project_id, created_at desc);

alter table preview_sessions enable row level security;

-- Project owner can read all preview sessions for their own projects (Preview
-- activity panel — Phase 2F). Written exclusively through the service-role
-- API route, so no insert/update/delete policy is needed for normal clients.
create policy "owner can read preview sessions" on preview_sessions
  for select using (
    exists (select 1 from projects where id = project_id and user_id = auth.uid())
  );

-- A viewer can read their own session rows (lets a future client-side cache
-- check bypass the API round-trip if desired).
create policy "viewer can read own preview sessions" on preview_sessions
  for select using (viewer_id = auth.uid());
