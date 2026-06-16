-- ── Organizations (multi-tenant) ──────────────────────────────────────────────

create table if not exists public.organizations (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  slug           text not null unique,
  owner_id       uuid not null references public.profiles(id) on delete cascade,
  logo_url       text,
  website        text,
  industry       text,
  company_size   text,
  description    text,
  custom_domain  text unique,  -- e.g. netenrich.com
  plan           text not null default 'free',  -- free | pro | enterprise
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

alter table public.organizations enable row level security;

create policy "org members can view"
  on public.organizations for select
  using (
    owner_id = auth.uid() or
    id in (select org_id from public.organization_members where user_id = auth.uid())
  );

create policy "owner can manage"
  on public.organizations for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ── Organization Members ───────────────────────────────────────────────────────

create table if not exists public.organization_members (
  id         uuid primary key default uuid_generate_v4(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text not null default 'member',  -- owner | admin | member | viewer
  created_at timestamptz default now(),
  unique(org_id, user_id)
);

alter table public.organization_members enable row level security;

create policy "members can view org memberships"
  on public.organization_members for select
  using (
    user_id = auth.uid() or
    org_id in (select id from public.organizations where owner_id = auth.uid())
  );

-- ── Employee Templates (100 pre-built) ────────────────────────────────────────

create table if not exists public.employee_templates (
  id                   uuid primary key default uuid_generate_v4(),
  slug                 text not null unique,
  name                 text not null,
  emoji                text not null default '🤖',
  role                 text not null,
  department           text not null,
  tagline              text not null,
  description          text not null,
  default_instructions text not null,
  default_tools        text[] not null default '{}',
  kpis                 jsonb not null default '[]',  -- [{name, description, unit, target}]
  popular              boolean default false,
  created_at           timestamptz default now()
);

-- Public read access for templates
alter table public.employee_templates enable row level security;
create policy "templates are public"
  on public.employee_templates for select using (true);

-- ── Alter AI Employees table ───────────────────────────────────────────────────

alter table public.ai_employees
  add column if not exists org_id           uuid references public.organizations(id) on delete set null,
  add column if not exists template_id      uuid references public.employee_templates(id) on delete set null,
  add column if not exists slug             text,
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists company_context  text,
  add column if not exists company_files    jsonb default '[]',
  add column if not exists kpis             jsonb default '[]',
  add column if not exists kpi_values       jsonb default '{}';

create index if not exists idx_ai_employees_org on public.ai_employees(org_id);
create index if not exists idx_ai_employees_template on public.ai_employees(template_id);

-- ── KPI Logs ───────────────────────────────────────────────────────────────────

create table if not exists public.ai_employee_kpi_logs (
  id          uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references public.ai_employees(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  run_id      uuid references public.ai_employee_runs(id) on delete set null,
  kpi_name    text not null,
  value       numeric not null,
  logged_at   timestamptz default now()
);

alter table public.ai_employee_kpi_logs enable row level security;

create policy "users view own kpi logs"
  on public.ai_employee_kpi_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_kpi_logs_employee
  on public.ai_employee_kpi_logs(employee_id, logged_at desc);

-- ── Custom Domains ─────────────────────────────────────────────────────────────

create table if not exists public.custom_domains (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  domain      text not null unique,
  verified    boolean not null default false,
  txt_record  text,
  created_at  timestamptz default now()
);

alter table public.custom_domains enable row level security;
create policy "org owner manages domains"
  on public.custom_domains for all
  using (org_id in (select id from public.organizations where owner_id = auth.uid()))
  with check (org_id in (select id from public.organizations where owner_id = auth.uid()));
