-- Net-new SSO connection mapping (WorkOS), additive only.

create table if not exists public.org_sso_connections (
  id                   uuid primary key default uuid_generate_v4(),
  org_id               uuid not null references public.organizations(id) on delete cascade,
  workos_org_id        text not null unique,
  workos_connection_id text,
  domain               text,
  status               text not null default 'pending' check (status in ('pending', 'active', 'disabled')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique(org_id)
);

alter table public.org_sso_connections enable row level security;

create policy "org admins manage sso connection"
  on public.org_sso_connections for all
  using (
    org_id in (
      select org_id from public.organization_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  )
  with check (
    org_id in (
      select org_id from public.organization_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- Default 'manual' auto-populates every existing row — no data migration risk.
alter table public.organization_members
  add column if not exists invited_via text not null default 'manual' check (invited_via in ('manual', 'sso', 'scim'));
