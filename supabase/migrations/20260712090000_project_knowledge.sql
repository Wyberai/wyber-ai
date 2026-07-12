-- Persistent per-project knowledge (brand, standards, API patterns) that the
-- builder applies on every run. Settable from the editor and the MCP server
-- (set_project_knowledge / get_project_knowledge tools).
alter table public.projects add column if not exists knowledge text;
