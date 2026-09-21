-- Lets an organization (see 007_employee_platform.sql) own multiple clients
-- (20260921000000_clients.sql), composing with the existing
-- projects.org_id (038_org_scoping_columns.sql). The two FKs on a project
-- are orthogonal by design: org_id says who can edit it, client_id (on
-- projects) / client_deliverables says who it's delivered to — a project
-- can be org-owned with no client yet, or client-linked without being
-- org-owned (the solo-founder Phase 1 setup, unchanged).

alter table public.clients
  add column if not exists org_id uuid references public.organizations(id) on delete set null;

create index if not exists idx_clients_org on public.clients(org_id) where org_id is not null;
