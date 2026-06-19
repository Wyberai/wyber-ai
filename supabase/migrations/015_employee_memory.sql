-- Persistent memory for AI employees: key-value facts that survive between runs
create table if not exists employee_memory (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.ai_employees(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  key         text not null,
  value       text not null,
  updated_at  timestamptz not null default now(),
  unique(employee_id, key)
);

alter table employee_memory enable row level security;

create policy "users manage own employee memory"
  on employee_memory for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index employee_memory_employee_idx on employee_memory(employee_id);

-- Also add a memory_summary column to ai_employees for a compressed narrative summary
alter table public.ai_employees
  add column if not exists memory_summary text default '';
