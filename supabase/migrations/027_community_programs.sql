-- Community program submissions (blood donor, build in public, accessibility, open source)
create table if not exists community_program_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program text not null check (program in ('blood_donor', 'build_in_public', 'accessibility', 'open_source')),
  proof_url text,
  proof_text text,
  bonus_type text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table community_program_submissions enable row level security;
create policy "Users manage own submissions" on community_program_submissions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists community_prog_user_idx on community_program_submissions(user_id, program);
