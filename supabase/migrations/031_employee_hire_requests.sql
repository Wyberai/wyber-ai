-- ── Employee hire requests (owner-approved marketplace) ───────────────────────
-- Hiring a priced role isn't instant: the customer interviews, names their
-- instance, and submits a request at the current dynamic price. The platform
-- owner approves or rejects; on approval the actual ai_employee is provisioned.

create table if not exists public.employee_hire_requests (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  role_slug       text not null,
  role_title      text not null,
  employee_name   text not null,            -- the user-chosen instance name (e.g. "Max")
  requester_email text,
  company         text,
  note            text,
  quoted_price_cents int not null,          -- dynamic price at request time
  status          text not null default 'pending',  -- pending | approved | rejected
  decided_by      uuid references public.profiles(id) on delete set null,
  decided_at      timestamptz,
  final_price_cents int,                    -- owner may override at approval
  employee_id     uuid references public.ai_employees(id) on delete set null,
  created_at      timestamptz not null default now()
);

alter table public.employee_hire_requests enable row level security;

-- Requesters can see/create their own requests.
create policy "users manage own hire requests"
  on public.employee_hire_requests for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_hire_requests_status
  on public.employee_hire_requests(status, created_at desc);
create index if not exists idx_hire_requests_user
  on public.employee_hire_requests(user_id, created_at desc);
