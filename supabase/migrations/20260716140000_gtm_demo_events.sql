-- GTM demo funnel analytics. The outreach was flying blind (PostHog stubbed,
-- analytics tables never wired, demo pages untracked). This records the three
-- server-side funnel points so we can see per-company drop-off:
--   view        — recipient opened their demo page (/app/<slug>)
--   cta_click   — clicked "Sign up & customize" (/api/gtm/start-claim)
--   claimed     — signed up and the demo transferred to their account
-- Server-side + fire-and-forget, so it works for the ALREADY-LIVE demos with no
-- re-stamp, and a logging failure never affects the page/redirect.
create table if not exists gtm_demo_events (
  id uuid primary key default gen_random_uuid(),
  slug text,
  event text not null check (event in ('view', 'cta_click', 'claimed')),
  token text,
  ref text,
  ua text,
  created_at timestamptz not null default now()
);

create index if not exists idx_gtm_demo_events_slug on gtm_demo_events (slug);
create index if not exists idx_gtm_demo_events_event on gtm_demo_events (event);
create index if not exists idx_gtm_demo_events_created on gtm_demo_events (created_at desc);

alter table gtm_demo_events enable row level security;
-- Founder-internal analytics: service-role only, no public policy.
