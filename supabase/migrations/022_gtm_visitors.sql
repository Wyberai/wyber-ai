-- Website visitor tracking for GTM de-anonymization
create table if not exists gtm_visitors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ip_address text not null,
  company_name text,
  company_domain text,
  employee_count integer,
  page_url text,
  referrer text,
  visited_at timestamptz not null default now(),
  identified_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, ip_address)
);

alter table gtm_visitors enable row level security;
create policy "Users manage own visitors" on gtm_visitors
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists gtm_visitors_user_idx on gtm_visitors(user_id, visited_at desc);

-- Add meeting_booked status to leads
alter table gtm_leads drop constraint if exists gtm_leads_status_check;
alter table gtm_leads add constraint gtm_leads_status_check
  check (status in ('new','contacted','replied','qualified','converted','unsubscribed','bounced','enriched','meeting_booked'));
