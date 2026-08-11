-- ============================================================
-- Migration: backfill two mcp_messages columns that were never applied
-- ============================================================
-- Discovered by actually running real builds through start_build against
-- production: two earlier, unrelated migrations were written but never run
-- against the live database —
--   20260803000000_mcp_messages_project_type.sql   (project_type)
--   20260804000000_mcp_messages_published_url.sql  (published_url)
-- Both are re-created here with `if not exists` guards so this is safe to
-- run regardless of whether either one partially landed. Without these,
-- every start_build call fails immediately at the queue-insert step
-- ("column mcp_messages.project_type does not exist"), and even a build
-- that got past that would fail again writing its result back
-- ("column mcp_messages.published_url does not exist").

alter table public.mcp_messages
add column if not exists project_type text,   -- web-app | mobile | website | saas
add column if not exists published_url text;

create index if not exists idx_mcp_messages_project_type on public.mcp_messages(project_type);
create index if not exists idx_mcp_messages_published_url on public.mcp_messages(published_url) where published_url is not null;
