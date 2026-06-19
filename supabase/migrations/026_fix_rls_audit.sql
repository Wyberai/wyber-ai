-- Comprehensive RLS audit: ensure all tables have correct policies
-- and profiles row is auto-created on signup

-- 1. Fix ai_employees: drop and recreate policy to ensure it's correct
drop policy if exists "users manage own ai_employees" on ai_employees;
create policy "users manage own ai_employees" on ai_employees
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. Fix ai_employee_runs
drop policy if exists "users view own ai_employee_runs" on ai_employee_runs;
create policy "users view own ai_employee_runs" on ai_employee_runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. Ensure auto-create profile on signup (the FK constraint requires this)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, credits, plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    50,
    'free'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Backfill: create profiles for any auth.users that don't have one
insert into public.profiles (id, email, full_name, credits, plan)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  50,
  'free'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- 5. Fix employee_templates: make readable by all authenticated users
alter table employee_templates enable row level security;
drop policy if exists "anyone can read templates" on employee_templates;
create policy "anyone can read templates" on employee_templates
  for select using (true);

-- 6. Fix workflow_templates: make readable by all
alter table workflow_templates enable row level security;
drop policy if exists "anyone can read workflow templates" on workflow_templates;
create policy "anyone can read workflow templates" on workflow_templates
  for select using (true);

-- 7. Fix prebuilt_apps: ensure readable by all (templates are public)
drop policy if exists "anyone can read prebuilt apps" on prebuilt_apps;
create policy "anyone can read prebuilt apps" on prebuilt_apps
  for select using (true);
