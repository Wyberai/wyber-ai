-- composio_trigger_subscriptions: maps Composio trigger IDs to user agents/flows
CREATE TABLE IF NOT EXISTS public.composio_trigger_subscriptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_id      text NOT NULL,          -- Composio trigger instance ID
  trigger_slug    text NOT NULL,          -- e.g. GMAIL_NEW_GMAIL_MESSAGE
  agent_id        text NOT NULL,          -- gallery agent ID or 'flow:<uuid>'
  project_id      uuid,                   -- for canvas flows
  source_type     text NOT NULL DEFAULT 'gmail_new_email',
  is_active       boolean NOT NULL DEFAULT true,
  daily_cap       integer NOT NULL DEFAULT 24,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(trigger_id)
);

CREATE INDEX IF NOT EXISTS idx_composio_trigger_subs_user  ON public.composio_trigger_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_composio_trigger_subs_trig  ON public.composio_trigger_subscriptions(trigger_id) WHERE is_active;

ALTER TABLE public.composio_trigger_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_trigger_subs" ON public.composio_trigger_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- service_role needs unrestricted access (cron + webhook handler run with service key)
GRANT ALL ON public.composio_trigger_subscriptions TO service_role;

-- Verify
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'composio_trigger_subscriptions';
