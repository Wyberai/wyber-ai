-- Mobile bundle cache columns (WyberAi Go companion app)
-- Run in Supabase SQL editor (Dashboard → SQL)

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS mobile_bundle_url    TEXT,
  ADD COLUMN IF NOT EXISTS mobile_bundled_at    TIMESTAMPTZ;

-- Fast lookup: find all projects with a fresh bundle (< 1 hour old)
CREATE INDEX IF NOT EXISTS idx_projects_mobile_bundle
  ON projects (mobile_bundled_at)
  WHERE mobile_bundle_url IS NOT NULL;
