-- ============================================================
-- Migration: agent scheduling + notifications
-- Run in: Supabase dashboard → SQL Editor
-- Safe to re-run (IF NOT EXISTS / DO $$ guards throughout)
-- ============================================================

-- ── Per-user agent schedules ──────────────────────────────────────────────────
-- Separate from agent_workflows (which is the shared 5k-agent library).
-- One row per user × agent combination.
CREATE TABLE IF NOT EXISTS public.user_agent_schedules (
  id                 uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  agent_id           text         NOT NULL,   -- agent_workflows.agent_id e.g. 'WYBER-079'
  project_id         text         NOT NULL,   -- used when calling /api/agents/run
  cron_expression    text         NOT NULL,   -- standard 5-field cron e.g. '0 7 * * *'
  next_run_at        timestamptz,             -- pre-computed; scheduler queries this
  last_run_at        timestamptz,
  is_active          boolean      NOT NULL DEFAULT true,
  schedule_max_per_day int        NOT NULL DEFAULT 24,  -- hard cap: no agent fires > N×/day
  last_input         text,                   -- default input passed on scheduled runs
  created_at         timestamptz  NOT NULL DEFAULT now(),
  updated_at         timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (user_id, agent_id)                 -- one schedule per user per agent
);

ALTER TABLE public.user_agent_schedules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_agent_schedules'
      AND policyname = 'user_agent_schedules: own'
  ) THEN
    CREATE POLICY "user_agent_schedules: own"
      ON public.user_agent_schedules
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Index the scheduler's primary lookup: due + active rows
CREATE INDEX IF NOT EXISTS idx_user_agent_schedules_due
  ON public.user_agent_schedules (next_run_at)
  WHERE is_active = true AND next_run_at IS NOT NULL;

-- ── Notifications ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       text        NOT NULL,  -- 'scheduled_agent_skipped' | 'scheduled_agent_ran'
  payload    jsonb,
  read       boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications'
      AND policyname = 'notifications: own'
  ) THEN
    CREATE POLICY "notifications: own"
      ON public.notifications
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, created_at DESC)
  WHERE read = false;

-- ── Verify ────────────────────────────────────────────────────────────────────
-- Running this SELECT confirms both tables exist.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_agent_schedules', 'notifications')
ORDER BY table_name;
