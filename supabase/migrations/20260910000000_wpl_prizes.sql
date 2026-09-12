-- Wyber Premier League: rebrand of the (never publicly launched) Weekly Build
-- Challenge into a monthly, real-cash competition. See src/lib/challenge.ts.
--
-- Changes:
--   * week -> period : now holds a calendar-month key ('2026-09') instead of
--     an ISO week key. Rename is metadata-only; dependent indexes/constraints
--     follow automatically.
--   * Drop the one-entry-per-user-per-cycle cap: entries are now unlimited
--     per user per month (the growth bet is more builds, not fewer).
--   * award gains a third slot ('creative' = Most Creative, team-picked,
--     alongside 'editor' = team pick and 'upvoted' = community Fan Favorite).
--   * video_url: optional demo-video link collected at entry.
--   * awarded_usd: real cash amount recorded at award time, replacing
--     awarded_credits (prizes are no longer paid as in-app credits).

ALTER TABLE challenge_entries RENAME COLUMN week TO period;

DROP INDEX IF EXISTS challenge_entries_user_week_uniq;

ALTER TABLE challenge_entries DROP CONSTRAINT IF EXISTS challenge_entries_award_check;
ALTER TABLE challenge_entries ADD CONSTRAINT challenge_entries_award_check
  CHECK (award IN ('editor', 'upvoted', 'creative'));

ALTER TABLE challenge_entries
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS awarded_usd integer;

-- Gallery reads now rank/filter by period instead of week.
DROP INDEX IF EXISTS challenge_entries_week_rank_idx;
CREATE INDEX IF NOT EXISTS challenge_entries_period_rank_idx
  ON challenge_entries (period, status, vote_count DESC, created_at DESC);
