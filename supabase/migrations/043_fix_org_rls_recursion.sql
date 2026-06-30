-- Fixes a pre-existing circular RLS dependency between organizations and
-- organization_members (both from migration 007): organization_members'
-- SELECT policy queried organizations, and organizations' SELECT policy
-- queried organization_members right back. Dormant until migration 042 added
-- the first policy on `projects` that queries organization_members during a
-- plain insert, which now triggers "infinite recursion detected in policy
-- for relation organization_members" (42P17) on every project creation.
--
-- Fix: a SECURITY DEFINER helper bypasses RLS for the inner lookup, breaking
-- the cycle. This is the standard Postgres-recommended pattern for two
-- tables whose RLS policies reference each other.

create or replace function public.is_org_owner(check_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.organizations
    where id = check_org_id and owner_id = auth.uid()
  );
$$;

drop policy if exists "members can view org memberships" on public.organization_members;
create policy "members can view org memberships"
  on public.organization_members for select
  using (
    user_id = auth.uid() or public.is_org_owner(org_id)
  );
