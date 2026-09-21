-- Additive RLS policies for org-scoped clients (see 20260923000000). Postgres
-- combines multiple permissive policies on the same table with OR, so these
-- sit alongside the existing owner-only policy from 20260921000000_clients.sql
-- without touching it — an org-scoped client becomes visible/manageable to
-- its org's members in addition to (never instead of) its literal owner.

create policy "org members can view org clients"
  on public.clients for select
  using (
    org_id is not null
    and org_id in (select org_id from public.organization_members where user_id = auth.uid())
  );

create policy "org admins can manage org clients"
  on public.clients for all
  using (
    org_id is not null
    and org_id in (select org_id from public.organization_members where user_id = auth.uid() and role in ('owner', 'admin'))
  )
  with check (
    org_id is not null
    and org_id in (select org_id from public.organization_members where user_id = auth.uid() and role in ('owner', 'admin'))
  );
