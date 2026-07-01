-- Both tables had RLS DISABLED entirely, with full SELECT/INSERT/UPDATE/DELETE
-- grants to anon -- anyone with the public anon key (no login required) could
-- read/write/delete every user's project chat history and checkpoints via the
-- public REST API. project_messages had 209 live rows; project_checkpoints is
-- unused today (0 rows, the checkpoint feature is currently client-only) but
-- locked down anyway.
--
-- Scoped explicitly to owner-or-org-member (NOT via projects' "public
-- projects readable" policy) -- a project being publicly showcased should not
-- make its private chat history public too.
--
-- Safety note re: the prior RLS recursion incident (organizations <->
-- organization_members, fixed in migration 043 via the SECURITY DEFINER
-- is_org_owner() function): this policy queries organization_members
-- directly, whose own SELECT policy resolves via is_org_owner() (SECURITY
-- DEFINER, bypasses RLS on organizations) -- a one-way chain with no cycle.
-- Verified live: owner sees only their own rows, an unrelated authenticated
-- user sees zero rows, no recursion error.

ALTER TABLE project_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "access via owning project" ON project_messages
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_messages.project_id
    AND (
      projects.user_id = auth.uid()
      OR (projects.org_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_members.org_id = projects.org_id
        AND organization_members.user_id = auth.uid()
      ))
    )
  )
);

CREATE POLICY "access via owning project" ON project_checkpoints
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_checkpoints.project_id
    AND (
      projects.user_id = auth.uid()
      OR (projects.org_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_members.org_id = projects.org_id
        AND organization_members.user_id = auth.uid()
      ))
    )
  )
);
