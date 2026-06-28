-- Rolling project memory for the builder.
-- A compact, always-injected summary of what an app is (screens, data model,
-- conventions, integrations, standing user requests) so context survives past
-- the last-N-messages window. Distilled cheaply by Haiku after each build/edit.
-- Mirrors the AI-Employees memory_summary pattern (see 015_employee_memory.sql).

alter table public.projects add column if not exists memory_summary text;
