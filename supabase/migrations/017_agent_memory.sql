-- Agent persistent memory: stores a rolling summary per (user, source, agent node)
create table if not exists agent_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid not null,          -- flow id or project id
  agent_node_id text not null,      -- node id within the canvas
  memory_summary text not null default '',
  last_run_at timestamptz not null default now(),
  run_count integer not null default 0,
  updated_at timestamptz not null default now(),
  unique(user_id, source_id, agent_node_id)
);

alter table agent_memory enable row level security;

create policy "Users manage own agent memory"
  on agent_memory for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists agent_memory_user_source_idx
  on agent_memory(user_id, source_id);

-- RPC to safely increment run_count
create or replace function increment_agent_memory_run_count(
  p_user_id uuid, p_source_id uuid, p_node_id text
) returns void language sql security definer as $$
  update agent_memory
  set run_count = run_count + 1, updated_at = now()
  where user_id = p_user_id and source_id = p_source_id and agent_node_id = p_node_id;
$$;
