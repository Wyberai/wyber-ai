-- ============================================================
-- WYBER AI — Full Supabase Schema
-- Run this in: supabase.com → your project → SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PROFILES ─────────────────────────────────────────────────
-- Auto-created when user signs up via trigger
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text,
  avatar_url    text,
  plan          text not null default 'free',   -- 'free' | 'pro' | 'teams'
  credits       int  not null default 50,        -- Wyber: free tier = 50 (Lovable gives 30)
  credits_reset_at timestamptz default (now() + interval '30 days'),
  stripe_customer_id text,
  github_token  text,                            -- encrypted, for GitHub sync
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── PROJECTS ─────────────────────────────────────────────────
create table public.projects (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  name          text not null default 'Untitled App',
  description   text,
  framework     text not null default 'react-vite',  -- react-vite | vue | vanilla | next
  files         jsonb not null default '{}',          -- {path: {path, content, language}}
  is_public     boolean not null default false,
  share_slug    text unique,                          -- for public share links
  thumbnail_url text,
  -- Deployment
  deployed_url  text,                                 -- live URL after deploy
  vercel_project_id text,
  custom_domain text,
  -- GitHub
  github_repo   text,                                 -- owner/repo
  github_branch text default 'main',
  last_commit_sha text,
  -- Meta
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  -- Agent / Workflow canvas state (nodes + edges JSON)
  canvas_data   jsonb
);

-- ── GENERATIONS ──────────────────────────────────────────────
-- Every AI generation tracked for billing + analytics
create table public.generations (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid references public.projects(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  prompt          text not null,
  response_text   text,
  files_changed   text[],                -- array of file paths modified
  prompt_tokens   int default 0,
  completion_tokens int default 0,
  credits_used    int default 1,
  sandbox_ms      int default 0,         -- E2B sandbox time in ms
  status          text default 'success', -- success | error
  error_msg       text,
  created_at      timestamptz default now()
);

-- ── DEPLOYMENTS ──────────────────────────────────────────────
create table public.deployments (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  vercel_deploy_id text,
  url             text,
  status          text default 'building',  -- building | ready | error
  triggered_by    text default 'manual',     -- manual | auto
  created_at      timestamptz default now()
);

-- ── SUBSCRIPTIONS ────────────────────────────────────────────
create table public.subscriptions (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  stripe_subscription_id text unique,
  stripe_customer_id  text,
  plan                text not null,        -- pro | teams
  status              text not null,        -- active | canceled | past_due
  current_period_start timestamptz,
  current_period_end  timestamptz,
  cancel_at           timestamptz,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ── CREDIT TRANSACTIONS ──────────────────────────────────────
create table public.credit_transactions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  amount      int not null,                 -- positive = added, negative = used
  reason      text not null,               -- 'generation' | 'subscription' | 'topup' | 'bonus'
  ref_id      uuid,                        -- generation_id or stripe payment_intent
  balance_after int not null,
  created_at  timestamptz default now()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.generations enable row level security;
alter table public.deployments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.credit_transactions enable row level security;

-- Profiles: users see own only
create policy "profiles: own" on public.profiles
  for all using (auth.uid() = id);

-- Projects: own + public
create policy "projects: own" on public.projects
  for all using (auth.uid() = user_id);
create policy "projects: public read" on public.projects
  for select using (is_public = true);

-- Generations: own only
create policy "generations: own" on public.generations
  for all using (auth.uid() = user_id);

-- Deployments: own only
create policy "deployments: own" on public.deployments
  for all using (auth.uid() = user_id);

-- Subscriptions: own only
create policy "subscriptions: own" on public.subscriptions
  for all using (auth.uid() = user_id);

-- Credit transactions: own only
create policy "credits: own" on public.credit_transactions
  for all using (auth.uid() = user_id);

-- ── INDEXES ──────────────────────────────────────────────────
create index on public.projects(user_id, updated_at desc);
create index on public.projects(share_slug) where share_slug is not null;
create index on public.generations(project_id, created_at desc);
create index on public.generations(user_id, created_at desc);
create index on public.deployments(project_id, created_at desc);

-- ── UPDATED_AT TRIGGER ───────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ── STORAGE BUCKET ───────────────────────────────────────────
-- For project thumbnails and user avatars
insert into storage.buckets (id, name, public) values ('wyber-assets', 'wyber-assets', true)
on conflict do nothing;

create policy "wyber-assets: public read" on storage.objects
  for select using (bucket_id = 'wyber-assets');
create policy "wyber-assets: auth upload" on storage.objects
  for insert with check (bucket_id = 'wyber-assets' and auth.role() = 'authenticated');
create policy "wyber-assets: own delete" on storage.objects
  for delete using (bucket_id = 'wyber-assets' and auth.uid()::text = (storage.foldername(name))[1]);

-- ── PROJECT SNAPSHOTS (for version history restore) ──────────
create table public.project_snapshots (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  files       jsonb not null,
  label       text,                            -- auto: "Generation #12" or user: "Before redesign"
  generation_id uuid references public.generations(id),
  created_at  timestamptz default now()
);

alter table public.project_snapshots enable row level security;
create policy "snapshots: own" on public.project_snapshots
  for all using (auth.uid() = user_id);
create index on public.project_snapshots(project_id, created_at desc);

-- ── COMMUNITY TEMPLATES ───────────────────────────────────────
create table public.community_templates (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  project_id    uuid references public.projects(id) on delete set null,
  name          text not null,
  description   text not null,
  category      text not null,
  framework     text not null,
  tags          text[] default '{}',
  prompt        text not null,
  files         jsonb not null default '{}',
  thumbnail_url text,
  upvotes       int not null default 0,
  use_count     int not null default 0,
  is_approved   boolean not null default false,  -- moderation gate
  created_at    timestamptz default now()
);

alter table public.community_templates enable row level security;

create policy "community_templates: public read approved" on public.community_templates
  for select using (is_approved = true);
create policy "community_templates: own manage" on public.community_templates
  for all using (auth.uid() = user_id);

create index on public.community_templates(upvotes desc, created_at desc) where is_approved = true;
create index on public.community_templates(category) where is_approved = true;

-- Template upvotes junction table
create table public.template_upvotes (
  template_id uuid references public.community_templates(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (template_id, user_id)
);

alter table public.template_upvotes enable row level security;
create policy "template_upvotes: own" on public.template_upvotes
  for all using (auth.uid() = user_id);

-- Auto-update upvote count
create or replace function public.sync_upvote_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update public.community_templates set upvotes = upvotes + 1 where id = NEW.template_id;
  elsif TG_OP = 'DELETE' then
    update public.community_templates set upvotes = greatest(0, upvotes - 1) where id = OLD.template_id;
  end if;
  return null;
end;
$$;

create trigger sync_upvote_count after insert or delete on public.template_upvotes
  for each row execute function public.sync_upvote_count();
