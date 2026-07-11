-- ============================================================
-- Migration: complete mcp_messages for the MCP build consumer
-- ============================================================
-- The live mcp_messages table was created by an early migration with only
-- (id, project_id, user_id, message, status, created_at). Migration 004's fuller
-- definition used `create table if not exists`, so the response/error/processed_at
-- columns it lists were NEVER actually added to the existing table. The MCP build
-- consumer (/api/cron/mcp-consumer → lib/mcp/build-runner) and the get_message_status
-- tool read/write those columns, so add them idempotently here.

alter table public.mcp_messages add column if not exists response     text;
alter table public.mcp_messages add column if not exists error        text;
alter table public.mcp_messages add column if not exists processed_at timestamptz;

-- The consumer drains the queue with
--   WHERE status = 'queued'  ORDER BY created_at ASC
-- and reclaims crashed builds with
--   WHERE status = 'processing' AND created_at < <cutoff>
-- Both scans are covered by a (status, created_at) index.
create index if not exists idx_mcp_messages_status_created
  on public.mcp_messages(status, created_at);
