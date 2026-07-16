-- Per-channel click tracking for distribution posts. On-site analytics was empty
-- (PostHog stubbed), so UTMs alone were invisible. The /go?s=<channel> link logs
-- the source here server-side, then redirects to the homepage — giving real
-- per-channel click counts to see which surface actually drives traffic.
create table if not exists traffic_hits (
  id uuid primary key default gen_random_uuid(),
  source text,
  ref text,
  ua text,
  created_at timestamptz not null default now()
);
create index if not exists idx_traffic_hits_source on traffic_hits (source);
create index if not exists idx_traffic_hits_created on traffic_hits (created_at desc);
alter table traffic_hits enable row level security;
-- Founder-internal analytics: service-role only.
