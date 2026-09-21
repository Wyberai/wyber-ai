-- Client delivery pages: replaces one-off hand-coded HTML per client
-- (see src/app/showcase/glocal-electronics) with a data-driven record the
-- founder (and later, an agency org — see clients.org_id added in a later
-- migration) manages from a dashboard instead of hand-editing static files
-- per engagement.

create table if not exists public.clients (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references public.profiles(id) on delete cascade,
  name           text not null,
  slug           text not null unique,
  company_name   text,
  contact_email  text,
  contact_name   text,
  logo_url       text,
  brand_color    text not null default '#0EA5E9',
  intro_text     text,
  status         text not null default 'active' check (status in ('lead','active','paused','archived')),
  consultation_meeting_id uuid references public.consultation_meetings(id) on delete set null,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_clients_owner on public.clients(owner_id);
create index if not exists idx_clients_slug on public.clients(slug);

alter table public.clients enable row level security;

-- Owner-only management, same shape as preview_comments' owner policy
-- (20260920000000_preview_comments.sql). No public select policy — the
-- public /client/[slug] page reads via the service-role client server-side,
-- same pattern as src/app/org-landing/page.tsx.
create policy "owner can manage own clients"
  on public.clients for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- What a client sees on their delivery page: which projects, in what order,
-- with what framing. Kept separate from `projects` so the same project can
-- be shown to two different clients with different headline copy, or a
-- rough draft can be hidden from the client view without touching the
-- project's own is_public flag.
create table if not exists public.client_deliverables (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  project_id   uuid not null references public.projects(id) on delete cascade,
  headline     text,
  description  text,
  sort_order   integer not null default 0,
  is_visible   boolean not null default true,
  created_at   timestamptz not null default now(),
  unique(client_id, project_id)
);

create index if not exists idx_client_deliverables_client on public.client_deliverables(client_id, sort_order);

alter table public.client_deliverables enable row level security;

create policy "owner can manage own client deliverables"
  on public.client_deliverables for all
  using (exists (select 1 from public.clients where id = client_id and owner_id = auth.uid()))
  with check (exists (select 1 from public.clients where id = client_id and owner_id = auth.uid()));
