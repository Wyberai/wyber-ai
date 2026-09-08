create table if not exists vibe_cup_entries (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  city        text not null,
  project_url text not null,
  description text,
  created_at  timestamptz not null default now()
);

create index if not exists vibe_cup_entries_email_idx on vibe_cup_entries (email);
create index if not exists vibe_cup_entries_created_at_idx on vibe_cup_entries (created_at desc);
