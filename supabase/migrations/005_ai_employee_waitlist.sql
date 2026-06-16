-- ── AI Employee Waitlist ─────────────────────────────────────────────────────
create table if not exists public.ai_employee_waitlist (
  id         uuid primary key default uuid_generate_v4(),
  email      text not null,
  source     text default 'waitlist-page',
  created_at timestamptz default now(),
  constraint ai_employee_waitlist_email_unique unique (email)
);

alter table public.ai_employee_waitlist enable row level security;

-- Service role only — users never read this directly
create policy "service role insert waitlist"
  on public.ai_employee_waitlist for insert
  with check (true);
