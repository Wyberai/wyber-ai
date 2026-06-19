-- Flow run trace logs — stores each canvas execution result for observability
create table if not exists flow_run_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid not null,
  source_type text not null default 'flow' check (source_type in ('flow','project')),
  status text not null default 'success' check (status in ('success','error','partial')),
  node_count integer not null default 0,
  steps jsonb not null default '[]',
  duration_ms integer,
  triggered_by text not null default 'manual' check (triggered_by in ('manual','webhook','schedule')),
  created_at timestamptz not null default now()
);

alter table flow_run_logs enable row level security;

create policy "Users view own flow run logs"
  on flow_run_logs for select
  using (auth.uid() = user_id);

create policy "Users insert own flow run logs"
  on flow_run_logs for insert
  with check (auth.uid() = user_id);

create index if not exists flow_run_logs_source_idx
  on flow_run_logs(source_id, created_at desc);

create index if not exists flow_run_logs_user_idx
  on flow_run_logs(user_id, created_at desc);
