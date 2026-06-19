-- Role-specific knowledge base for AI Employees
create table if not exists employee_knowledge (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references ai_employees(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null default '',
  source text not null default 'manual' check (source in ('manual', 'url', 'file')),
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table employee_knowledge enable row level security;
create policy "Users manage own employee knowledge" on employee_knowledge
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists emp_knowledge_emp_idx on employee_knowledge(employee_id);
create index if not exists emp_knowledge_search_idx on employee_knowledge using gin(to_tsvector('english', content));
