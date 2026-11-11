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

create policy "owner or org member can view client quotes"
  on public.client_quotes for select
  using (exists (
    select 1 from public.clients c
    where c.id = client_id
      and (c.owner_id = auth.uid()
        or (c.org_id is not null and c.org_id in (select org_id from public.organization_members where user_id = auth.uid())))
  ));

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
