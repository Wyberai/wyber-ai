-- ============================================================
-- Analytics: visitor/page-view tracking for published apps
-- ============================================================
-- A lightweight beacon (injected into every published app's HTML) posts one
-- row per page view to /api/analytics/track. No auth on that endpoint — the
-- visitor is anonymous, not a WyberAi user — so this table accepts public
-- inserts but only the project owner can read their own data.

create table if not exists public.page_views (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  path          text not null default '/',
  referrer      text,
  session_id    text not null, -- client-generated, per-browser-session — used to dedupe "visitors" from "views"
  user_agent    text,
  created_at    timestamptz default now()
);

alter table public.page_views enable row level security;

-- Public insert: the beacon runs in an anonymous visitor's browser, not an
-- authenticated WyberAi session.
drop policy if exists "anyone can record a page view" on public.page_views;
create policy "anyone can record a page view"
  on public.page_views for insert
  with check (true);

-- Only the project owner can read their own analytics.
drop policy if exists "owners read own page_views" on public.page_views;
create policy "owners read own page_views"
  on public.page_views for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = page_views.project_id
        and p.user_id = auth.uid()
    )
  );

grant insert on public.page_views to anon;
grant select, insert on public.page_views to authenticated;
grant select, insert on public.page_views to service_role;

create index if not exists idx_page_views_project_id on public.page_views(project_id);
create index if not exists idx_page_views_created_at on public.page_views(created_at);
create index if not exists idx_page_views_session_id on public.page_views(session_id);
