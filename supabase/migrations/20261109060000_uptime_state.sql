-- State for the 5-minute uptime check of the email service (api/cron/uptime). One row per thing watched ("continuum").
-- It lets the check alert once when the service goes down, again every hour while it stays down, and once when it recovers.
-- Without this table the check still works, but can only remind once an hour and cannot say "recovered".
-- Service-role only (RLS on, no policies), the same posture as email_events.
create table if not exists public.uptime_state (
  key           text primary key,
  status        text not null check (status in ('up', 'down')),
  since         timestamptz not null default now(),
  last_alert_at timestamptz,
  updated_at    timestamptz not null default now()
);
alter table public.uptime_state enable row level security;
