-- Public tip submissions for the /app/paper-leaks dashboard. Anyone can
-- suggest an incident via the "Suggest a paper leak" form; nothing here is
-- auto-published — every tip is manually verified against real sources
-- before it's added to src/lib/paper-leaks/data.ts, same bar as every
-- existing entry (see that file's header comment).
create table if not exists public.paper_leak_tips (
  id               uuid primary key default gen_random_uuid(),
  exam_name        text not null,
  state            text,
  year             int,
  description      text not null,
  source_url       text,
  reporter_email   text,
  reporter_ip_hash text,
  status           text not null default 'open',   -- open | reviewed | added | dismissed
  created_at       timestamptz not null default now()
);

-- RLS on, with NO policies: same pattern as content_reports — the anon/
-- authenticated roles can neither read nor write. Tips are only ever
-- inserted by the service role (which bypasses RLS) inside
-- /api/paper-leaks/submit, so a submitter can never enumerate others' tips.
alter table public.paper_leak_tips enable row level security;

create index if not exists paper_leak_tips_status_idx
  on public.paper_leak_tips (status, created_at desc);
