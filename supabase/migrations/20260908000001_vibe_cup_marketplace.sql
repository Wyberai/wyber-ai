-- Extend the entries table with marketplace fields
alter table vibe_cup_entries
  add column if not exists app_name       text,
  add column if not exists demo_url       text,
  add column if not exists thumbnail_url  text,
  add column if not exists is_approved    boolean not null default false,
  add column if not exists award          text check (award in ('most_creative','most_liked','best_design','most_useful')),
  add column if not exists vote_count     integer not null default 0;

-- Votes table (mirrors challenge_votes pattern)
create table if not exists vibe_cup_votes (
  id          uuid primary key default gen_random_uuid(),
  entry_id    uuid not null references vibe_cup_entries(id) on delete cascade,
  voter_key   text not null,
  user_id     uuid,
  created_at  timestamptz not null default now(),
  unique(entry_id, voter_key)
);

create index if not exists vibe_cup_votes_entry_idx  on vibe_cup_votes (entry_id);
create index if not exists vibe_cup_votes_voter_idx  on vibe_cup_votes (voter_key);

-- Trigger: keep vote_count in sync automatically
create or replace function vibe_cup_update_vote_count()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update vibe_cup_entries set vote_count = vote_count + 1 where id = new.entry_id;
  elsif (tg_op = 'DELETE') then
    update vibe_cup_entries set vote_count = greatest(vote_count - 1, 0) where id = old.entry_id;
  end if;
  return null;
end;
$$;

drop trigger if exists vibe_cup_vote_count_trigger on vibe_cup_votes;
create trigger vibe_cup_vote_count_trigger
after insert or delete on vibe_cup_votes
for each row execute function vibe_cup_update_vote_count();

-- Index for the approved marketplace listing
create index if not exists vibe_cup_entries_approved_idx on vibe_cup_entries (is_approved, vote_count desc, created_at desc);
