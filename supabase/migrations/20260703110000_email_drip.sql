-- Lifecycle email drip: recurring nudges need per-user send tracking (so
-- "email every few days" never becomes "email every cron run") and a lawful,
-- working opt-out (the template footer has always linked /unsubscribe — which
-- 404'd until now).
--
-- ⚠ MUST BE RUN MANUALLY in the Supabase dashboard SQL editor (the CLI on the
-- dev machine is linked to a different Supabase account).

alter table profiles add column if not exists email_opt_out boolean not null default false;

create table if not exists email_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,             -- 'credits-drip' | 'getting-started' | 'publish-nudge' | ...
  sent_count int not null default 0,
  last_sent_at timestamptz,
  primary key (user_id, kind)
);

-- Service-role only (RLS on, no policies).
alter table email_events enable row level security;
