-- ── Repair: ensure the full memory substrate exists ──────────────────────────
-- The stress test revealed migration 030's pgvector version was never fully
-- applied (employee_entities missing; employee_episodes lacked grants/embedding).
-- This migration is idempotent — safe to run regardless of current state.

create extension if not exists vector;

-- Episodes: ensure the semantic-recall columns exist on the (possibly older) table.
create table if not exists public.employee_episodes (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.ai_employees(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  run_id      uuid references public.ai_employee_runs(id) on delete set null,
  trigger     text,
  summary     text not null,
  learnings   text,
  outcome     text,
  importance  int not null default 3,
  created_at  timestamptz not null default now()
);
alter table public.employee_episodes add column if not exists embedding vector(1024);
create index if not exists idx_employee_episodes_recent on public.employee_episodes(employee_id, created_at desc, importance desc);
create index if not exists idx_employee_episodes_vec on public.employee_episodes using hnsw (embedding vector_cosine_ops);

alter table public.employee_episodes enable row level security;
drop policy if exists "users manage own employee episodes" on public.employee_episodes;
create policy "users manage own employee episodes" on public.employee_episodes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Entities: the missing table.
create table if not exists public.employee_entities (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid not null references public.ai_employees(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  kind         text not null,
  name         text not null,
  identifier   text,
  notes        text,
  state        text,
  importance   int not null default 3,
  embedding    vector(1024),
  last_seen_at timestamptz default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (employee_id, kind, name)
);
create index if not exists idx_employee_entities_lookup on public.employee_entities(employee_id, kind, last_seen_at desc);
create index if not exists idx_employee_entities_vec on public.employee_entities using hnsw (embedding vector_cosine_ops);
alter table public.employee_entities enable row level security;
drop policy if exists "users manage own employee entities" on public.employee_entities;
create policy "users manage own employee entities" on public.employee_entities for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Structured self-model.
alter table public.ai_employees add column if not exists self_model jsonb not null default '{}'::jsonb;

-- Recall RPCs.
create or replace function public.match_employee_episodes(p_employee_id uuid, p_query vector(1024), p_k int default 8)
returns setof public.employee_episodes language sql stable as $$
  select * from public.employee_episodes where employee_id = p_employee_id and embedding is not null
  order by embedding <=> p_query limit greatest(p_k, 1);
$$;
create or replace function public.match_employee_entities(p_employee_id uuid, p_query vector(1024), p_k int default 6)
returns setof public.employee_entities language sql stable as $$
  select * from public.employee_entities where employee_id = p_employee_id and embedding is not null
  order by embedding <=> p_query limit greatest(p_k, 1);
$$;

-- Grants (fixes the service_role "permission denied" seen on employee_episodes).
grant all on public.employee_episodes to service_role;
grant all on public.employee_entities to service_role;
grant select, insert, update, delete on public.employee_episodes to authenticated;
grant select, insert, update, delete on public.employee_entities to authenticated;
