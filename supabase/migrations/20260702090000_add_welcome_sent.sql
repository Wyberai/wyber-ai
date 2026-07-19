-- profiles.welcome_sent gates three features that all shipped assuming this
-- column existed (it never did, so every one of them has been silently dead):
--   1. the welcome email to the new user       (src/app/auth/callback/route.ts)
--   2. the owner "New signup 🎉" alert email    (src/app/auth/callback/route.ts)
--   3. the dashboard onboarding tour            (src/app/dashboard/page.tsx)
-- The update `.eq('welcome_sent', false)` errored on the missing column,
-- returned no row, and the code treated that as "already sent".
alter table public.profiles
  add column if not exists welcome_sent boolean not null default false;

-- Existing accounts predate the feature — mark them sent so they don't get a
-- surprise welcome email + onboarding tour on their next login. Only signups
-- after this migration flow through the send-once flip.
update public.profiles set welcome_sent = true;
