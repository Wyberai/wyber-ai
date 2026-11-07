-- Tech Expo Gujarat booth leads. Until now /api/expo-lead only sent an admin
-- email, so the inbox was the only record of a lead. Service-role only.
create table if not exists expo_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  whatsapp text not null,
  whatsapp_norm text not null,          -- last 10 digits, for dedup
  email text,
  business text,
  audience text,
  preferred_day text,
  pain_point text not null,
  source text not null default 'direct',
  utm_source text,
  utm_campaign text,
  status text not null default 'new'
    check (status in ('new','contacted','meeting_booked','met_at_booth','building','won','lost')),
  notes text,
  updated_at timestamptz not null default now()
);
create index if not exists idx_expo_leads_norm_time on expo_leads (whatsapp_norm, created_at desc);
create index if not exists idx_expo_leads_status on expo_leads (status, created_at desc);
alter table expo_leads enable row level security;
