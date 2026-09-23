-- Backfills organization_members for orgs created before the owner-membership-row fix
-- (POST /api/organizations previously only set organizations.owner_id, never inserted
-- an organization_members row) — without this, every RBAC-protected /api/orgs/[orgId]
-- route (requireOrgCapability checks organization_members, not owner_id) locks the
-- owner out of their own org. Idempotent: only inserts where the row is missing.

insert into public.organization_members (org_id, user_id, role, invited_via)
select o.id, o.owner_id, 'owner', 'manual'
from public.organizations o
where not exists (
  select 1 from public.organization_members m
  where m.org_id = o.id and m.user_id = o.owner_id
)
on conflict (org_id, user_id) do nothing;
