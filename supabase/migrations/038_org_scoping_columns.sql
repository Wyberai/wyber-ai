-- Additive: nullable org_id on projects/deployments/generations for org-scoped (enterprise) access.
-- org_id IS NULL is and remains the default personal-project path — zero behavior change for
-- existing rows/queries. No backfill, no NOT NULL, no default change.

alter table public.projects
  add column if not exists org_id uuid references public.organizations(id) on delete set null;

alter table public.deployments
  add column if not exists org_id uuid references public.organizations(id) on delete set null;

alter table public.generations
  add column if not exists org_id uuid references public.organizations(id) on delete set null;

-- Partial indexes: cheap, invisible to existing personal-project query plans (org_id is null for them).
create index if not exists idx_projects_org on public.projects(org_id) where org_id is not null;
create index if not exists idx_deployments_org on public.deployments(org_id) where org_id is not null;
create index if not exists idx_generations_org on public.generations(org_id) where org_id is not null;
