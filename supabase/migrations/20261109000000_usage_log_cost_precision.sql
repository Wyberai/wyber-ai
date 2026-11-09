-- generation_usage_log.cost_usd was numeric(10,4): four decimal places. The per-call rows added by
-- src/lib/ai-usage.ts include many small Haiku calls that cost a few millionths of a dollar each, and those round
-- to 0.0000, so a SUM(cost_usd) under-reports them. Widen the column so each call keeps its real cost.
-- Token counts were always stored exactly, so nothing was ever lost: scripts/ai-spend-report.mjs recomputes cost from
-- tokens and is correct with or without this migration.
alter table public.generation_usage_log
  alter column cost_usd type numeric(14,7);
