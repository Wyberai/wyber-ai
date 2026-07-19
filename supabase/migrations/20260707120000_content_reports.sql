-- User-generated-content abuse reports (App Store 1.2 / Google Play UGC policy).
-- Published apps are public UGC; every published page carries a "Report" control
-- that writes here via the /api/report route (service client). We triage from
-- the reports table + an admin email alert, and can unpublish within 24h.
create table if not exists public.content_reports (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid references public.projects(id) on delete set null,
  slug             text,
  reason           text not null,
  details          text,
  reporter_ip_hash text,
  status           text not null default 'open',   -- open | reviewed | actioned | dismissed
  created_at       timestamptz not null default now()
);

-- RLS on, with NO policies: the anon/authenticated roles can neither read nor
-- write. Reports are only ever inserted by the service role (which bypasses RLS)
-- inside /api/report, so a reporter can never enumerate or read others' reports.
alter table public.content_reports enable row level security;

create index if not exists content_reports_status_idx
  on public.content_reports (status, created_at desc);
