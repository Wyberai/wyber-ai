-- Additive RLS policies layering org-scoped (enterprise) access on top of the existing
-- user_id-scoped policies. Every policy below is guarded by `org_id is not null`, so personal
-- projects (org_id null) are never touched and existing policies are never altered.
--
-- No org-write policies on deployments/generations for MVP: those are written by the existing
-- service-role deploy/generate pipeline already, which bypasses RLS.

-- projects: org members can view org-scoped projects
create policy "org members can view org projects"
  on public.projects for select
  using (
    org_id is not null
    and org_id in (select org_id from public.organization_members where user_id = auth.uid())
  );

-- projects: org owners/admins can manage (update/delete) org-scoped projects
create policy "org admins can manage org projects"
  on public.projects for all
  using (
    org_id is not null
    and org_id in (
      select org_id from public.organization_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  )
  with check (
    org_id is not null
    and org_id in (
      select org_id from public.organization_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- projects: any org member can create a project in their org (still attributed to themselves,
-- so it also surfaces in existing "my projects" .eq('user_id', ...) queries)
create policy "org members can create org projects"
  on public.projects for insert
  with check (
    org_id is not null
    and org_id in (select org_id from public.organization_members where user_id = auth.uid())
    and user_id = auth.uid()
  );

-- deployments: org-scoped view mirror
create policy "org members can view org deployments"
  on public.deployments for select
  using (
    org_id is not null
    and org_id in (select org_id from public.organization_members where user_id = auth.uid())
  );

-- generations: org-scoped view mirror
create policy "org members can view org generations"
  on public.generations for select
  using (
    org_id is not null
    and org_id in (select org_id from public.organization_members where user_id = auth.uid())
  );
