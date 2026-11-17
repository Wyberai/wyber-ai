-- Two tables that exist in supabase/migrations but were never created in the production database (found 17 Nov 2026).
-- Paste this whole file into the Supabase SQL editor for the WyberAi project and press Run. Safe to run twice.

-- 1. mobile_builds: without it every APK and IPA build fails with "Failed to create build record" (migration 037).
create table if not exists public.mobile_builds (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('apk', 'ipa')),
  status text not null default 'queued',
  eas_build_id text,
  build_url text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists mobile_builds_project_platform_idx on public.mobile_builds(project_id, platform);
create index if not exists mobile_builds_user_idx on public.mobile_builds(user_id);
create index if not exists mobile_builds_status_idx on public.mobile_builds(status);
alter table public.mobile_builds enable row level security;
drop policy if exists "Users can view their own mobile builds" on public.mobile_builds;
create policy "Users can view their own mobile builds" on public.mobile_builds for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own mobile builds" on public.mobile_builds;
create policy "Users can insert their own mobile builds" on public.mobile_builds for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own mobile builds" on public.mobile_builds;
create policy "Users can update their own mobile builds" on public.mobile_builds for update using (auth.uid() = user_id);

-- 2. uptime_state: state for the 5-minute email-service check (migration 20261109060000). Service-role only.
create table if not exists public.uptime_state (
  key           text primary key,
  status        text not null check (status in ('up', 'down')),
  since         timestamptz not null default now(),
  last_alert_at timestamptz,
  updated_at    timestamptz not null default now()
);
alter table public.uptime_state enable row level security;

-- Make the API see the new tables straight away.
notify pgrst, 'reload schema';
