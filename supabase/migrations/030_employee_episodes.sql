-- ── Employee memory substrate (2030-native) ──────────────────────────────────
-- Designed for total, relevance-based recall — not "the last N by date". Memory is
-- a retrievable knowledge substrate the employee accumulates over its whole tenure:
--   • episodes  — what happened + what was learned, semantically searchable
--   • entities  — the people/accounts/campaigns it knows and tracks over time
--   • self_model — structured goals/skills/relationships/open-threads on the employee
-- Today's runtime feeds the model a relevant slice; the substrate already scales to
-- unbounded history, so capability grows with the models without re-architecting.

create extension if not exists vector;

-- voyage-3-large → 1024-dim embeddings (cosine).
-- If you switch embedding models, keep the dimension at 1024 or migrate the column.

-- ── Episodic memory ───────────────────────────────────────────────────────────
create table if not exists public.employee_episodes (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.ai_employees(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  run_id      uuid references public.ai_employee_runs(id) on delete set null,
  trigger     text,                       -- what prompted this run
  summary     text not null,              -- what happened
  learnings   text,                       -- what worked / what to do differently
  outcome     text,                       -- success | partial | failed (+ context)
  importance  int not null default 3,     -- 1-5, weights recall
  embedding   vector(1024),               -- semantic recall vector (null until embedded)
  created_at  timestamptz not null default now()
);

alter table public.employee_episodes enable row level security;
create policy "users manage own employee episodes"
  on public.employee_episodes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_employee_episodes_recent
  on public.employee_episodes(employee_id, created_at desc, importance desc);
create index if not exists idx_employee_episodes_vec
  on public.employee_episodes using hnsw (embedding vector_cosine_ops);

-- ── Entity memory (people, accounts, campaigns the employee knows) ────────────
create table if not exists public.employee_entities (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid not null references public.ai_employees(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  kind         text not null,             -- person | account | campaign | tool | other
  name         text not null,             -- "Sarah Lin", "Acme Corp", "Q3 Launch"
  identifier   text,                      -- email / domain / external id, if any
  notes        text,                      -- what the employee knows about it
  state        text,                      -- relationship/status: "warm", "stalled", "active"…
  importance   int not null default 3,
  embedding    vector(1024),
  last_seen_at timestamptz default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (employee_id, kind, name)
);

alter table public.employee_entities enable row level security;
create policy "users manage own employee entities"
  on public.employee_entities for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_employee_entities_lookup
  on public.employee_entities(employee_id, kind, last_seen_at desc);
create index if not exists idx_employee_entities_vec
  on public.employee_entities using hnsw (embedding vector_cosine_ops);

-- ── Structured self-model on the employee ─────────────────────────────────────
-- { goals: [...], skills: [...], relationships: [...], open_threads: [...] }
-- Coexists with the human-readable ai_employees.memory_summary narrative.
alter table public.ai_employees
  add column if not exists self_model jsonb not null default '{}'::jsonb;

-- ── Relevance recall functions (cosine similarity, scoped to one employee) ────
create or replace function public.match_employee_episodes(
  p_employee_id uuid, p_query vector(1024), p_k int default 8
) returns setof public.employee_episodes
language sql stable as $$
  select * from public.employee_episodes
  where employee_id = p_employee_id and embedding is not null
  order by embedding <=> p_query
  limit greatest(p_k, 1);
$$;

create or replace function public.match_employee_entities(
  p_employee_id uuid, p_query vector(1024), p_k int default 6
) returns setof public.employee_entities
language sql stable as $$
  select * from public.employee_entities
  where employee_id = p_employee_id and embedding is not null
  order by embedding <=> p_query
  limit greatest(p_k, 1);
$$;
