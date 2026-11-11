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
create policy "owner or org member can view client feedback"
  on public.client_feedback for select
  using (exists (
    select 1 from public.clients c
    where c.id = client_id
      and (c.owner_id = auth.uid()
        or (c.org_id is not null and c.org_id in (select org_id from public.organization_members where user_id = auth.uid())))
  ));

create policy "owner or org member can view client updates"
  on public.client_updates for select
  using (exists (
    select 1 from public.clients c
    where c.id = client_id
      and (c.owner_id = auth.uid()
        or (c.org_id is not null and c.org_id in (select org_id from public.organization_members where user_id = auth.uid())))
  ));

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
