-- ============================================================
-- Migration: Add project_type to mcp_messages for website/saas
-- ============================================================

alter table public.mcp_messages
add column project_type text; -- web-app | mobile | website | saas

-- Index for filtering by project type if needed
create index if not exists idx_mcp_messages_project_type on public.mcp_messages(project_type);
