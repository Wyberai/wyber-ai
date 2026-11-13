-- WyberAi agency mode: the three migrations in order, as one paste-ready file.
-- Run it once in the Supabase SQL editor. It is safe to run again: every table and column uses "if not exists",
-- and every policy is dropped first, so a second run changes nothing.
--
-- It needs these to exist already (they were created by earlier migrations): public.clients, public.client_deliverables,
-- public.projects, public.profiles, public.organizations, public.organization_members, public.consultation_meetings.
-- The check at the very bottom lists anything missing.

-- ============================================================================
-- 1 of 3: 20261111000000_agency_mode.sql
-- ============================================================================

-- Agency mode v2: client review, updates, a lockable link, and view tracking.
-- Additive only: every new column is nullable or has a default, so existing clients and delivery pages behave
-- exactly as before until an agency uses the new controls.
-- All reads and writes from the app go through the service-role client (see src/lib/agency/access.ts), which
-- bypasses RLS and grants. The policies below are the safety net for any direct authenticated access.

-- Optional passcode (scrypt "salt:hash"), and a light activity signal for the agency.
alter table public.clients
  add column if not exists portal_passcode_hash text,
  add column if not exists view_count integer not null default 0,
  add column if not exists last_viewed_at timestamptz;

-- Where each deliverable stands with the client.
alter table public.client_deliverables
  add column if not exists review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'changes_requested')),
  add column if not exists reviewed_at timestamptz;

-- Everything a client says on their page: approvals, change requests and plain comments. Kept as history so
-- "changes requested, then approved" reads as a thread, not a single overwritten state.
create table if not exists public.client_feedback (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients(id) on delete cascade,
  deliverable_id uuid references public.client_deliverables(id) on delete cascade,
  kind           text not null check (kind in ('approved', 'changes_requested', 'comment')),
  author_name    text,
  body           text,
  created_at     timestamptz not null default now()
);
create index if not exists idx_client_feedback_client on public.client_feedback(client_id, created_at desc);
create index if not exists idx_client_feedback_deliverable on public.client_feedback(deliverable_id, created_at);

-- Short updates the agency posts to the client's page.
create table if not exists public.client_updates (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients(id) on delete cascade,
  author_id  uuid references public.profiles(id) on delete set null,
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_client_updates_client on public.client_updates(client_id, created_at desc);

alter table public.client_feedback enable row level security;
alter table public.client_updates enable row level security;

-- Same shape as clients: the owner, and members of the client's organization.
drop policy if exists "owner or org member can view client feedback" on public.client_feedback;
create policy "owner or org member can view client feedback"
  on public.client_feedback for select
  using (exists (
    select 1 from public.clients c
    where c.id = client_id
      and (c.owner_id = auth.uid()
        or (c.org_id is not null and c.org_id in (select org_id from public.organization_members where user_id = auth.uid())))
  ));

drop policy if exists "owner or org member can view client updates" on public.client_updates;
create policy "owner or org member can view client updates"
  on public.client_updates for select
  using (exists (
    select 1 from public.clients c
    where c.id = client_id
      and (c.owner_id = auth.uid()
        or (c.org_id is not null and c.org_id in (select org_id from public.organization_members where user_id = auth.uid())))
  ));

drop policy if exists "owner or org editor can manage client updates" on public.client_updates;
create policy "owner or org editor can manage client updates"
  on public.client_updates for all
  using (exists (
    select 1 from public.clients c
    where c.id = client_id
      and (c.owner_id = auth.uid()
        or (c.org_id is not null and c.org_id in (
          select org_id from public.organization_members where user_id = auth.uid() and role in ('owner', 'admin', 'member'))))
  ))
  with check (exists (
    select 1 from public.clients c
    where c.id = client_id
      and (c.owner_id = auth.uid()
        or (c.org_id is not null and c.org_id in (
          select org_id from public.organization_members where user_id = auth.uid() and role in ('owner', 'admin', 'member'))))
  ));

-- Anonymous clients never touch these tables directly: feedback is written by /api/portal/[slug]/review, which
-- validates and rate-limits. No public policy on purpose.
grant select on public.client_feedback to authenticated;
grant select, insert, update, delete on public.client_updates to authenticated;

-- ============================================================================
-- 2 of 3: 20261112000000_agency_freelancer_flow.sql
-- ============================================================================

-- Agency mode v3: the freelancer's full job (see docs/agency-mode-plan.md).
-- Additive only. Every new column is nullable or defaulted, so clients and pages from v2 keep working unchanged.
-- As in v2, the app reads and writes through the service-role client; the policies are the safety net.

-- Feedback can be closed out: "Mark done" after the freelancer has made the change.
alter table public.client_feedback
  add column if not exists resolved boolean not null default false,
  add column if not exists resolved_at timestamptz;

-- Intake: a separate link the client uses to send a brief before any project exists.
alter table public.clients
  add column if not exists brief_token text unique,
  add column if not exists brief jsonb,
  add column if not exists brief_submitted_at timestamptz;

-- Handover: when a project was delivered to the client, and the note that goes with it.
alter table public.client_deliverables
  add column if not exists delivered_at timestamptz,
  add column if not exists handover_note text;

-- Whether an update was also emailed to the client.
alter table public.client_updates
  add column if not exists emailed_at timestamptz;

-- Quotes. Totals are computed on the server from the line items. WyberAi never processes the payment: the
-- freelancer's own payment instructions and link are shown once the client accepts, and "paid" is marked by hand.
create table if not exists public.client_quotes (
  id                   uuid primary key default gen_random_uuid(),
  client_id            uuid not null references public.clients(id) on delete cascade,
  number               text not null,
  title                text not null,
  currency             text not null default 'USD',
  items                jsonb not null default '[]'::jsonb,
  total                numeric(14, 2) not null default 0,
  note                 text,
  payment_instructions text,
  payment_url          text,
  status               text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'declined', 'paid')),
  sent_at              timestamptz,
  responded_at         timestamptz,
  responded_by         text,
  decline_reason       text,
  paid_at              timestamptz,
  created_at           timestamptz not null default now(),
  unique (client_id, number)
);
create index if not exists idx_client_quotes_client on public.client_quotes(client_id, created_at desc);

alter table public.client_quotes enable row level security;

drop policy if exists "owner or org member can view client quotes" on public.client_quotes;
create policy "owner or org member can view client quotes"
  on public.client_quotes for select
  using (exists (
    select 1 from public.clients c
    where c.id = client_id
      and (c.owner_id = auth.uid()
        or (c.org_id is not null and c.org_id in (select org_id from public.organization_members where user_id = auth.uid())))
  ));

drop policy if exists "owner or org editor can manage client quotes" on public.client_quotes;
create policy "owner or org editor can manage client quotes"
  on public.client_quotes for all
  using (exists (
    select 1 from public.clients c
    where c.id = client_id
      and (c.owner_id = auth.uid()
        or (c.org_id is not null and c.org_id in (
          select org_id from public.organization_members where user_id = auth.uid() and role in ('owner', 'admin', 'member'))))
  ))
  with check (exists (
    select 1 from public.clients c
    where c.id = client_id
      and (c.owner_id = auth.uid()
        or (c.org_id is not null and c.org_id in (
          select org_id from public.organization_members where user_id = auth.uid() and role in ('owner', 'admin', 'member'))))
  ));

grant select, insert, update, delete on public.client_quotes to authenticated;

-- ============================================================================
-- 3 of 3: 20261113000000_agency_business_profile.sql
-- ============================================================================

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

drop policy if exists "owner manages own agency profile" on public.agency_profiles;
create policy "owner manages own agency profile"
  on public.agency_profiles for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "workspace members view the workspace profile" on public.agency_profiles;
create policy "workspace members view the workspace profile"
  on public.agency_profiles for select
  using (org_id is not null and org_id in (select org_id from public.organization_members where user_id = auth.uid()));

drop policy if exists "workspace owners and admins manage the workspace profile" on public.agency_profiles;
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

-- ============================================================================
-- Check: every line below should say "ok". Anything that says MISSING needs fixing before agency mode is used.
-- ============================================================================
select 'client_feedback' as thing, case when to_regclass('public.client_feedback') is not null then 'ok' else 'MISSING' end as status
union all select 'client_updates', case when to_regclass('public.client_updates') is not null then 'ok' else 'MISSING' end
union all select 'client_quotes', case when to_regclass('public.client_quotes') is not null then 'ok' else 'MISSING' end
union all select 'agency_profiles', case when to_regclass('public.agency_profiles') is not null then 'ok' else 'MISSING' end
union all select 'clients.portal_passcode_hash', case when exists (select 1 from information_schema.columns where table_schema='public' and table_name='clients' and column_name='portal_passcode_hash') then 'ok' else 'MISSING' end
union all select 'clients.brief_token', case when exists (select 1 from information_schema.columns where table_schema='public' and table_name='clients' and column_name='brief_token') then 'ok' else 'MISSING' end
union all select 'client_deliverables.delivered_at', case when exists (select 1 from information_schema.columns where table_schema='public' and table_name='client_deliverables' and column_name='delivered_at') then 'ok' else 'MISSING' end
union all select 'client_quotes.recurrence', case when exists (select 1 from information_schema.columns where table_schema='public' and table_name='client_quotes' and column_name='recurrence') then 'ok' else 'MISSING' end
union all select 'rate_limit_hit() function (passcode limiter)', case when to_regproc('public.rate_limit_hit') is not null then 'ok' else 'MISSING: passcode unlock will refuse everyone until it exists' end
union all select 'clients.org_id (workspace sharing)', case when exists (select 1 from information_schema.columns where table_schema='public' and table_name='clients' and column_name='org_id') then 'ok' else 'MISSING' end;
