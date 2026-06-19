-- AI Employee voice clips
create table if not exists employee_voice_clips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  employee_id uuid references ai_employees(id) on delete set null,
  label text not null default 'Voice clip',
  text text not null default '',
  audio_url text,
  provider text not null default 'none' check (provider in ('elevenlabs', 'openai', 'none')),
  created_at timestamptz not null default now()
);

alter table employee_voice_clips enable row level security;
create policy "Users manage own voice clips" on employee_voice_clips
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists emp_voice_clips_user_idx on employee_voice_clips(user_id, created_at desc);
create index if not exists emp_voice_clips_emp_idx on employee_voice_clips(employee_id, created_at desc);

-- Storage bucket for audio files (run this separately in Supabase dashboard Storage section
-- or uncomment if using supabase-js admin):
-- insert into storage.buckets (id, name, public) values ('employee-voice-clips', 'employee-voice-clips', true) on conflict do nothing;
