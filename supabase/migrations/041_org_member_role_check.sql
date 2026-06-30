-- Guard organization_members.role to the four documented values.
-- Before running in prod, verify no out-of-band values exist:
--   select distinct role from organization_members where role not in ('owner','admin','member','viewer');
-- NOT VALID skips scanning/locking existing rows — safe to add without downtime.
-- Validate later with: alter table public.organization_members validate constraint organization_members_role_check;

alter table public.organization_members
  drop constraint if exists organization_members_role_check;

alter table public.organization_members
  add constraint organization_members_role_check
  check (role in ('owner', 'admin', 'member', 'viewer')) not valid;
