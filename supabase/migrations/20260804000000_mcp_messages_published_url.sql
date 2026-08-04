-- ============================================================
-- Migration: Add published_url to mcp_messages
-- ============================================================

alter table public.mcp_messages
add column published_url text;

-- Index for querying completed builds with URLs
create index if not exists idx_mcp_messages_published_url on public.mcp_messages(published_url) where published_url is not null;
