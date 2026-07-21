-- Founder launch checklist — the human-judgment half of launch readiness.
-- Pricing, positioning, support staffing, marketing channel, success metrics,
-- and legal-entity status are founder decisions, not code properties, so
-- unlike launch_readiness_scans (which is an automated re-runnable scan
-- history), this is a single self-certified state per project: one row,
-- upserted in place as the founder ticks items off. See
-- src/lib/launch-checklist.ts for the fixed item set and rationale.

create table if not exists public.launch_checklist (
  project_id uuid primary key references public.projects(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  items      jsonb not null default '{}'::jsonb, -- { [itemId]: { checked: bool, note?: string } }
  updated_at timestamptz not null default now()
);

alter table public.launch_checklist enable row level security;
create policy "users read own launch checklist"
  on public.launch_checklist for select
  using (auth.uid() = user_id);
create policy "users upsert own launch checklist"
  on public.launch_checklist for insert
  with check (auth.uid() = user_id);
create policy "users update own launch checklist"
  on public.launch_checklist for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
