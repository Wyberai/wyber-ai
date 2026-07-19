-- Claim-link token for GTM demos. Cold-outreach recipients often sign up with a
-- different email than the one we mailed, so email-match alone would strand
-- their personalized dashboard. Each demo also gets an unguessable claim_token;
-- the outreach link carries it, /api/gtm/start-claim drops it in a cookie, and
-- the claim step transfers the project on signup regardless of which email they
-- use. Cleared (with the other demo flags) once claimed.
alter table projects add column if not exists claim_token text;

create index if not exists idx_projects_claim_token
  on projects (claim_token)
  where is_demo = true;
