-- The single ALL-command policy let a user's own browser session write to
-- their own row directly via the Supabase client SDK, bypassing the
-- /api/community-programs route entirely -- including setting status to
-- 'approved' themselves. Replace with SELECT (own rows) + INSERT (own rows,
-- forced to status='pending'). No user-writable UPDATE/DELETE: only
-- service_role (used by the API route during manual review) can change
-- status, and service_role bypasses RLS anyway.
DROP POLICY IF EXISTS "Users manage own submissions" ON community_program_submissions;

CREATE POLICY "Users can view own submissions" ON community_program_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pending submissions" ON community_program_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');
