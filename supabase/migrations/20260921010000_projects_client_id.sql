-- Links a project to the client it's being delivered to (see
-- 20260921000000_clients.sql). Additive and nullable, same pattern as
-- projects.org_id from 038_org_scoping_columns.sql — most projects will
-- never have a client_id, and RLS on `projects` itself is untouched.
-- Note: client_deliverables is the actual source of truth for what a client
-- SEES on their delivery page (with per-deliverable ordering/visibility);
-- this column is a lighter "which client is this for" tag for the founder's
-- own dashboard/filtering, not something the /client/[slug] page reads.

alter table public.projects
  add column if not exists client_id uuid references public.clients(id) on delete set null;

create index if not exists idx_projects_client on public.projects(client_id) where client_id is not null;
