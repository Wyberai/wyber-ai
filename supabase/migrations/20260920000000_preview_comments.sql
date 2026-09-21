-- Client review/comment mode: lets an anonymous reviewer (a consultation
-- client, a teammate) pin feedback directly onto a project's published
-- preview instead of over WhatsApp/email. Off by default per project —
-- feedback_mode_enabled is an explicit opt-in the owner flips on for a
-- review, not something silently live on every production app.

alter table public.projects
  add column if not exists feedback_mode_enabled boolean not null default false;

create table if not exists public.preview_comments (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  page_path    text not null default '/',
  x_pct        numeric not null,
  y_pct        numeric not null,
  body         text not null,
  author_name  text,
  resolved     boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.preview_comments enable row level security;

-- Only the project owner can read/manage comments. Anonymous inserts never
-- go through this policy — they're written by the service-role API route
-- (rate-limited + validated there), so there is deliberately no public
-- insert/select policy here.
create policy "owner can manage preview comments"
  on public.preview_comments for all
  using (exists (select 1 from public.projects where id = project_id and user_id = auth.uid()));

create index if not exists idx_preview_comments_project on public.preview_comments(project_id, created_at desc);
