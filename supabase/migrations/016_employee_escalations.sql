-- Human-in-the-loop escalations: employee pauses and waits for user approval
create table if not exists employee_escalations (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.ai_employees(id) on delete cascade,
  run_id      uuid not null references public.ai_employee_runs(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  question    text not null,
  context     text not null default '',
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  decision    text,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

alter table employee_escalations enable row level security;

create policy "users manage own escalations"
  on employee_escalations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index employee_escalations_user_idx on employee_escalations(user_id, status, created_at desc);
create index employee_escalations_run_idx on employee_escalations(run_id);

-- Add webhook_url to flows table for webhook-triggered flows
alter table public.flows
  add column if not exists webhook_url text;

create unique index if not exists flows_webhook_url_idx on public.flows(webhook_url)
  where webhook_url is not null;
