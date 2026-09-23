-- Tracks inbound "Enterprise enquiry" leads from the /enterprise page (previously a bare
-- mailto: link with zero persistence). No INSERT/SELECT policy — writes happen via the
-- service-role client only (src/app/api/enterprise/leads/route.ts, /admin/enterprise-leads),
-- matching the audit_logs pattern.

create table if not exists public.enterprise_leads (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  email        text not null,
  company      text not null,
  team_size    text,
  message      text,
  source       text not null default 'enterprise_page',
  status       text not null default 'new' check (status in ('new', 'contacted', 'demo_scheduled', 'design_partner', 'won', 'lost')),
  notes        text,
  org_id       uuid references public.organizations(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.enterprise_leads enable row level security;

create index if not exists idx_enterprise_leads_status_created on public.enterprise_leads(status, created_at desc);
