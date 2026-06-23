-- ── Employee episodic memory ──────────────────────────────────────────────────
-- The compounding memory that turns a stateless agent into a senior employee.
-- After every run the employee reflects on what it did and what it learned; that
-- reflection is stored here as an "episode". On the next run, recent + important
-- episodes are recalled into the prompt so the employee builds on past experience
-- instead of starting cold every time ("last campaign, Tuesday sends beat Thursday
-- by 12%, so I'll repeat that").
--
-- This complements (does not replace) the two existing memory stores:
--   employee_memory   — flat key→value facts (explicit, model-written)
--   employee_knowledge — semantic docs/SOPs (company-provided, RAG)
-- and ai_employees.memory_summary — a rolling compressed narrative of the employee.

create table if not exists public.employee_episodes (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.ai_employees(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  run_id      uuid references public.ai_employee_runs(id) on delete set null,
  trigger     text,                       -- what prompted this run (task / inbound email / schedule)
  summary     text not null,              -- what happened
  learnings   text,                       -- what worked, what didn't, what to do differently next time
  outcome     text,                       -- 'success' | 'partial' | 'failed' (+ KPI deltas in text)
  importance  int not null default 3,     -- 1-5: how much this should weigh in future recall
  created_at  timestamptz not null default now()
);

alter table public.employee_episodes enable row level security;

create policy "users manage own employee episodes"
  on public.employee_episodes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Recall query: most recent, tie-broken by importance, scoped to one employee.
create index if not exists idx_employee_episodes_recall
  on public.employee_episodes(employee_id, created_at desc, importance desc);
