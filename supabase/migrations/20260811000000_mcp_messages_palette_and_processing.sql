-- ============================================================
-- Migration: mcp_messages — palette_id + real processing-start timestamp
-- ============================================================
-- palette_id: the design palette selected via the MCP get_palette_options /
-- start_build flow was being silently dropped before this migration — there
-- was no column to persist it, so build-runner.ts could never forward it to
-- /api/generate as paletteId.
--
-- processing_started_at: the cron consumer's stale-build reclaim previously
-- keyed off created_at (when the message was QUEUED), not when a worker
-- actually started processing it. A message queued behind others for more
-- than the reclaim window could be reclaimed and reprocessed while a worker
-- was still genuinely running it. This column lets the reclaim query check
-- how long a message has actually been processing, not how long it has
-- existed.

alter table public.mcp_messages
add column if not exists palette_id text,
add column if not exists processing_started_at timestamptz;

create index if not exists idx_mcp_messages_processing_started
  on public.mcp_messages(processing_started_at)
  where status = 'processing';

-- Two queued messages for the SAME project could previously be claimed
-- (queued -> processing) by two overlapping cron ticks and run concurrently,
-- each independently reading/writing projects.files — last write silently
-- wins, discarding one build's changes. This partial unique index makes the
-- atomic claim update itself fail with a constraint violation if a second
-- message for the same project is already processing, so build-runner.ts's
-- existing "no row returned -> skip this tick" path naturally serializes
-- builds per project with no additional app-level locking needed.
create unique index if not exists idx_mcp_messages_one_processing_per_project
  on public.mcp_messages(project_id)
  where status = 'processing';
