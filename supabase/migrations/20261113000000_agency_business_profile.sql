-- Agency mode v4: the agency's own identity, and two quote fields freelancers need.
-- A business profile belongs to exactly one tenant: either one person (a freelancer's own profile) or one workspace
-- (an agency). It is what the client sees on their page, quotes and emails: the business, not WyberAi.
-- Additive only; nothing existing changes until a profile is saved.

create table if not exists public.agency_profiles (
  id                           uuid primary key default gen_random_uuid(),
  owner_id                     uuid references public.profiles(id) on delete cascade,
  org_id                       uuid references public.organizations(id) on delete cascade,
  business_name                text,
  logo_url                     text,
  website                      text,
  support_email                text,
  phone                        text,
  address                      text,
  tax_label                    text,
  tax_id                       text,
  default_currency             text,
  default_payment_instructions text,
  default_terms                text,
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now(),
  -- one tenant per row: a person or a workspace, never both, never neither
  constraint agency_profiles_one_tenant check ((owner_id is not null) <> (org_id is not null)),
  constraint agency_profiles_owner_unique unique (owner_id),
  constraint agency_profiles_org_unique unique (org_id)
);

alter table public.agency_profiles enable row level security;

create policy "owner manages own agency profile"
  on public.agency_profiles for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "workspace members view the workspace profile"
  on public.agency_profiles for select
  using (org_id is not null and org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "workspace owners and admins manage the workspace profile"
  on public.agency_profiles for all
  using (org_id is not null and org_id in (select org_id from public.organization_members where user_id = auth.uid() and role in ('owner', 'admin')))
  with check (org_id is not null and org_id in (select org_id from public.organization_members where user_id = auth.uid() and role in ('owner', 'admin')));

grant select, insert, update, delete on public.agency_profiles to authenticated;

-- Quotes: terms the client agrees to, and whether the price repeats (a monthly retainer, yearly hosting).
alter table public.client_quotes
  add column if not exists terms text,
  add column if not exists recurrence text not null default 'one_time'
    check (recurrence in ('one_time', 'monthly', 'yearly'));
