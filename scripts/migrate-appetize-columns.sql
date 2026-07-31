-- Appetize real-device preview columns
-- Run this in Supabase SQL editor (Dashboard → SQL)

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS appetize_build_id        TEXT,
  ADD COLUMN IF NOT EXISTS appetize_build_status     TEXT DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS appetize_build_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS appetize_build_snapshot   JSONB;

-- Index so status polls are fast
CREATE INDEX IF NOT EXISTS idx_projects_appetize_status
  ON projects (appetize_build_status)
  WHERE appetize_build_status IN ('queued', 'building');
