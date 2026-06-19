-- Project version snapshots: save & restore any point-in-time state of a project's files
create table if not exists project_snapshots (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  label        text not null default '',
  files        jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

alter table project_snapshots enable row level security;

create policy "users see own snapshots"
  on project_snapshots for select
  using (auth.uid() = user_id);

create policy "users insert own snapshots"
  on project_snapshots for insert
  with check (auth.uid() = user_id);

create policy "users delete own snapshots"
  on project_snapshots for delete
  using (auth.uid() = user_id);

create index project_snapshots_project_idx on project_snapshots(project_id, created_at desc);
