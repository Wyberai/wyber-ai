-- Weekly Build Challenge: opt-in gallery + community upvotes.
--
-- Two tables:
--   challenge_entries  -- one opt-in submission (a build someone chose to show)
--   challenge_votes    -- one community upvote, at most one per user per entry
--
-- Security model mirrors the hardened community_program_submissions pattern:
-- users NEVER write these tables directly from the browser SDK. All writes go
-- through the /api/challenge/* routes using the service_role key (which bypasses
-- RLS). That closes the hole where a client could self-approve, stuff votes, or
-- edit vote_count. RLS here only grants PUBLIC READ of approved entries so the
-- gallery renders; there are deliberately no user INSERT/UPDATE/DELETE policies.

-- ── Entries ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS challenge_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id    uuid REFERENCES projects(id) ON DELETE SET NULL,
  week          text NOT NULL,                       -- ISO week key, e.g. '2026-W27'
  title         text NOT NULL,
  description   text NOT NULL,
  handle        text,                                -- optional social handle
  live_url      text,                                -- optional: protective founders can omit
  thumbnail_url text,                                -- screenshot / preview image
  status        text NOT NULL DEFAULT 'approved',    -- 'approved' | 'hidden' (owner can hide)
  vote_count    integer NOT NULL DEFAULT 0,          -- denormalized, maintained by trigger
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- One active entry per user per week keeps the gallery from being spammed and
-- nudges people to submit their single best build.
CREATE UNIQUE INDEX IF NOT EXISTS challenge_entries_user_week_uniq
  ON challenge_entries (user_id, week)
  WHERE status <> 'hidden';

-- Gallery reads: approved entries for a week, ranked by votes.
CREATE INDEX IF NOT EXISTS challenge_entries_week_rank_idx
  ON challenge_entries (week, status, vote_count DESC, created_at DESC);

ALTER TABLE challenge_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved entries" ON challenge_entries;
CREATE POLICY "Anyone can view approved entries" ON challenge_entries
  FOR SELECT USING (status = 'approved');

-- ── Votes ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS challenge_votes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id   uuid NOT NULL REFERENCES challenge_entries(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entry_id, user_id)                         -- one vote per user per entry
);

CREATE INDEX IF NOT EXISTS challenge_votes_user_idx ON challenge_votes (user_id);

ALTER TABLE challenge_votes ENABLE ROW LEVEL SECURITY;
-- No user-facing policies: only the service_role (API route) may read/write.

-- ── Keep vote_count correct regardless of who writes ──────────────────────────
CREATE OR REPLACE FUNCTION bump_challenge_vote_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE challenge_entries SET vote_count = vote_count + 1 WHERE id = NEW.entry_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE challenge_entries SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = OLD.entry_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_challenge_vote_count ON challenge_votes;
CREATE TRIGGER trg_challenge_vote_count
  AFTER INSERT OR DELETE ON challenge_votes
  FOR EACH ROW EXECUTE FUNCTION bump_challenge_vote_count();
