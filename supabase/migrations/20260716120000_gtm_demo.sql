-- GTM personalized-demo campaign support.
--
-- The dev-shop outreach engine stamps ~100 near-identical dashboard projects
-- (one per target founder) under a single outreach account, publishes each to
-- a free slug, and — if the founder replies and signs up — transfers ownership
-- of their specific demo to their new account (/api/gtm/claim).
--
-- Two columns drive that flow plus its guardrails:
--   is_demo       marks a project as an unclaimed campaign demo. Used to (a)
--                 noindex the published page (100 near-duplicate pages with real
--                 company names must not be indexed), and (b) let the cleanup
--                 cron delete only unclaimed demos. Cleared to false on claim,
--                 so a claimed project behaves like any normal user project.
--   target_email  the founder we built this demo for; the claim route matches
--                 lower(target_email) against the signing-in user's email. Never
--                 shown in the UI. Cleared on claim.
alter table projects add column if not exists is_demo boolean not null default false;
alter table projects add column if not exists target_email text;

-- Claim lookup matches case-insensitively on email among unclaimed demos.
create index if not exists idx_projects_demo_target_email
  on projects (lower(target_email))
  where is_demo = true;

-- Cleanup cron scans unclaimed demos by age.
create index if not exists idx_projects_demo_created
  on projects (created_at)
  where is_demo = true;
