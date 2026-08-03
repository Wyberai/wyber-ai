-- Mobile APK/IPA builds: premium feature (50 credits each)
-- Tracks build status, EAS build IDs, and download URLs

create table if not exists public.mobile_builds (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('apk', 'ipa')), -- apk | ipa
  status text not null default 'queued', -- queued | building | ready | error
  eas_build_id text,
  build_url text, -- Downloadable URL after build completes
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists mobile_builds_project_platform_idx on public.mobile_builds(project_id, platform);
create index if not exists mobile_builds_user_idx on public.mobile_builds(user_id);
create index if not exists mobile_builds_status_idx on public.mobile_builds(status);

alter table public.mobile_builds enable row level security;

create policy "Users can view their own mobile builds"
  on public.mobile_builds for select
  using (auth.uid() = user_id);

create policy "Users can insert their own mobile builds"
  on public.mobile_builds for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own mobile builds"
  on public.mobile_builds for update
  using (auth.uid() = user_id);
