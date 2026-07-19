-- Per-user, per-day cache of AI-generated app ideas ("Today's ideas").
-- Written by the service role from /api/suggestions; users can only read their own rows.
create table if not exists public.daily_suggestions (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  suggestions jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.daily_suggestions enable row level security;

drop policy if exists "daily_suggestions_select_own" on public.daily_suggestions;
create policy "daily_suggestions_select_own"
  on public.daily_suggestions for select
  using (auth.uid() = user_id);
