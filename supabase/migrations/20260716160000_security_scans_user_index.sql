-- Dashboard needs "latest scan per project, across all of this user's projects"
-- on every page load. The existing index (project_id, created_at desc) is
-- built for a single-project lookup; this one lets the whole-dashboard query
-- (user_id = ?, order by created_at desc) hit an index instead of a scan.

create index if not exists idx_security_scans_user
  on public.security_scans(user_id, created_at desc);
