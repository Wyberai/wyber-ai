-- Tags each project with where it was created so the admin dashboard and MCP
-- alert email can distinguish web-built projects from ones created through
-- the Claude MCP connector (now live in Anthropic's directory as of today).
--
-- ⚠ MUST BE RUN MANUALLY in the Supabase dashboard SQL editor (the CLI on the
-- dev machine is linked to a different Supabase account — same note as
-- 20260726030000_project_free_image_slot.sql).

alter table projects add column if not exists created_via text not null default 'web';
create index if not exists projects_created_via_idx on projects(created_via);
