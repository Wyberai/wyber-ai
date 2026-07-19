-- Net-new audit_logs table for org-scoped (enterprise) actions. Zero risk to existing schema.
-- No INSERT policy: writes happen only via the service-role client (src/lib/orgs/audit.ts),
-- which bypasses RLS — matches the existing pattern for admin-only writes in this codebase.

create table if not exists public.audit_logs (
  id            uuid primary key default uuid_generate_v4(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  user_id       uuid references public.profiles(id) on delete set null,
  action        text not null,
  resource_type text not null,
  resource_id   uuid,
  before_state  jsonb,
  after_state   jsonb,
  ip_address    text,
  user_agent    text,
  created_at    timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

create index if not exists idx_audit_logs_org_created on public.audit_logs(org_id, created_at desc);
create index if not exists idx_audit_logs_resource on public.audit_logs(resource_type, resource_id);

create policy "org admins can view audit logs"
  on public.audit_logs for select
  using (
    org_id in (
      select org_id from public.organization_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );
