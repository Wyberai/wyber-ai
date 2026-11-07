-- First-party funnel events (see src/lib/funnel-events.ts).
-- Written only by /api/funnel/event with the service role; no policies, so
-- clients can neither read nor write it directly.
create table if not exists funnel_events (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  event text not null,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_funnel_events_event_time on funnel_events (event, created_at desc);
create index if not exists idx_funnel_events_user on funnel_events (user_id, created_at desc);
alter table funnel_events enable row level security;
