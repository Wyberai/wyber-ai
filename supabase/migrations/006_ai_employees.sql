-- ── AI Employees ──────────────────────────────────────────────────────────────

create table if not exists public.ai_employees (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  role            text not null,
  emoji           text not null default '🤖',
  instructions    text not null,
  tools           text[] not null default '{}',
  schedule_type   text not null default 'manual',  -- manual | hourly | daily | weekly
  schedule_hour   int default 9,                   -- 0-23 UTC
  schedule_day    int default 1,                   -- 0=Sun … 6=Sat (weekly only)
  cron_expression text,
  is_active       boolean not null default true,
  next_run_at     timestamptz,
  last_run_at     timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.ai_employees enable row level security;

create policy "users manage own ai_employees"
  on public.ai_employees for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_ai_employees_user
  on public.ai_employees(user_id);

create index if not exists idx_ai_employees_due
  on public.ai_employees(next_run_at)
  where is_active = true and next_run_at is not null;

-- ── AI Employee Runs ───────────────────────────────────────────────────────────

create table if not exists public.ai_employee_runs (
  id              uuid primary key default uuid_generate_v4(),
  employee_id     uuid not null references public.ai_employees(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  triggered_by    text not null default 'manual',   -- manual | schedule
  status          text not null default 'running',  -- running | success | error
  summary         text,
  actions_taken   jsonb default '[]',
  credits_used    int not null default 0,
  error_message   text,
  started_at      timestamptz default now(),
  finished_at     timestamptz,
  created_at      timestamptz default now()
);

alter table public.ai_employee_runs enable row level security;

create policy "users view own ai_employee_runs"
  on public.ai_employee_runs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_ai_employee_runs_employee
  on public.ai_employee_runs(employee_id, created_at desc);

create index if not exists idx_ai_employee_runs_user
  on public.ai_employee_runs(user_id, created_at desc);
