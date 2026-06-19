-- GTM Pillar: tables for company profiles, leads, campaigns, sequences, analytics

-- Company / ICP profile (one per user, standalone — no project required)
create table if not exists gtm_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text,
  company_url text,
  company_description text,
  -- ICP fields
  icp_industries text[],
  icp_company_sizes text[],         -- e.g. ['1-10','11-50','51-200']
  icp_geographies text[],
  icp_seniorities text[],           -- e.g. ['VP','Director','C-Suite']
  icp_pain_points text[],
  icp_trigger_events text[],        -- e.g. ['Recent funding','Hiring surge']
  value_proposition text,
  differentiation text,
  -- connected providers (api keys stored encrypted in user_api_keys)
  lead_provider text default 'apollo',       -- apollo | zoominfo | lusha | csv
  outreach_provider text default 'smartlead', -- smartlead | instantly | outreach | salesloft | gmail | outlook
  calling_provider text,                     -- apollo | justcall | aircall | null
  crm_provider text,                         -- hubspot | salesforce | attio | pipedrive | null
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Named lead lists
create table if not exists gtm_lead_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  lead_count int default 0,
  created_at timestamptz default now()
);

-- Individual leads / contacts
create table if not exists gtm_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  list_id uuid references gtm_lead_lists(id) on delete set null,
  -- contact info
  first_name text,
  last_name text,
  email text,
  email_verified boolean default false,
  phone text,
  linkedin_url text,
  title text,
  seniority text,
  -- company info
  company_name text,
  company_domain text,
  company_size text,
  company_industry text,
  company_location text,
  company_linkedin_url text,
  company_funding text,
  company_tech_stack text[],
  company_news text,                 -- latest signal from enrichment
  -- scoring
  icp_fit_score int default 0,      -- 0-100
  signal_score int default 0,       -- 0-100 based on recent signals
  -- status
  status text default 'new',        -- new | contacted | replied | converted | suppressed | bounced
  suppressed boolean default false,
  suppressed_reason text,
  -- source
  source text default 'manual',     -- apollo | csv | manual | linkedin
  external_id text,                 -- provider's own id
  -- raw enrichment data
  enrichment_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Campaigns
create table if not exists gtm_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  list_id uuid references gtm_lead_lists(id) on delete set null,
  name text not null,
  goal text,                        -- meeting | demo | nurture | newsletter | event
  type text default 'outreach',     -- outreach | newsletter | event
  status text default 'draft',      -- draft | active | paused | completed | archived
  -- provider routing
  outreach_provider text,           -- overrides profile default
  calling_provider text,
  -- external campaign id (in Smartlead / Outreach etc.)
  external_campaign_id text,
  -- canvas data (JSON node graph — same format as agent/workflow canvas)
  canvas jsonb,
  -- schedule
  send_days text[] default array['Mon','Tue','Wed','Thu'],
  send_start_hour int default 9,
  send_end_hour int default 17,
  timezone text default 'UTC',
  -- stats (denormalised for dashboard speed)
  stats jsonb default '{"sent":0,"delivered":0,"opens":0,"clicks":0,"replies":0,"bounces":0,"unsubscribes":0,"calls_made":0,"calls_answered":0}',
  credits_used int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sequence templates (reusable, detached from campaign)
create table if not exists gtm_sequences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references gtm_campaigns(id) on delete cascade,
  name text not null,
  goal text,
  is_template boolean default false,
  created_at timestamptz default now()
);

-- Sequence steps
create table if not exists gtm_sequence_steps (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null references gtm_sequences(id) on delete cascade,
  step_order int not null,
  type text not null,               -- email | call | linkedin | wait | branch
  -- email fields
  subject text,
  body text,
  -- call fields
  call_script text,
  call_duration_target int,         -- minutes
  -- wait fields
  wait_days int,
  -- branch fields
  branch_condition text,            -- opened | replied | called_answered | no_signal
  branch_yes_step_id uuid,
  branch_no_step_id uuid,
  -- personalisation tokens used
  tokens_used text[],
  created_at timestamptz default now()
);

-- Connected email / calling accounts
create table if not exists gtm_provider_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,           -- smartlead | instantly | outreach | salesloft | gmail | outlook | justcall | aircall | apollo
  account_label text,               -- e.g. "john@company.com"
  status text default 'active',     -- active | warming | paused | error
  warmup_score int,                 -- 0-100 if applicable
  daily_limit int default 50,
  external_id text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Every outreach action logged
create table if not exists gtm_outreach_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references gtm_campaigns(id) on delete set null,
  lead_id uuid references gtm_leads(id) on delete set null,
  step_id uuid references gtm_sequence_steps(id) on delete set null,
  type text not null,               -- email | call | linkedin
  provider text,
  status text,                      -- queued | sent | delivered | failed
  subject text,
  body_preview text,
  external_id text,                 -- provider's message/call id
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- Analytics events (webhooks from Smartlead, Instantly, JustCall etc.)
create table if not exists gtm_analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references gtm_campaigns(id) on delete set null,
  lead_id uuid references gtm_leads(id) on delete set null,
  outreach_log_id uuid references gtm_outreach_logs(id) on delete set null,
  event_type text not null,         -- open | click | reply | bounce | unsubscribe | call_answered | call_voicemail | call_no_answer
  provider text,
  provider_event_id text unique,    -- deduplication
  metadata jsonb,
  occurred_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Suppression list
create table if not exists gtm_suppressions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  domain text,
  reason text,                      -- unsubscribed | bounced | complained | manual
  created_at timestamptz default now()
);

-- RLS
alter table gtm_profiles enable row level security;
alter table gtm_lead_lists enable row level security;
alter table gtm_leads enable row level security;
alter table gtm_campaigns enable row level security;
alter table gtm_sequences enable row level security;
alter table gtm_sequence_steps enable row level security;
alter table gtm_provider_accounts enable row level security;
alter table gtm_outreach_logs enable row level security;
alter table gtm_analytics_events enable row level security;
alter table gtm_suppressions enable row level security;

-- Policies (user sees only their own data)
do $$ begin
  create policy "gtm_profiles_owner" on gtm_profiles for all using (auth.uid() = user_id);
  create policy "gtm_lead_lists_owner" on gtm_lead_lists for all using (auth.uid() = user_id);
  create policy "gtm_leads_owner" on gtm_leads for all using (auth.uid() = user_id);
  create policy "gtm_campaigns_owner" on gtm_campaigns for all using (auth.uid() = user_id);
  create policy "gtm_sequences_owner" on gtm_sequences for all using (auth.uid() = user_id);
  create policy "gtm_sequence_steps_owner" on gtm_sequence_steps for all using (
    sequence_id in (select id from gtm_sequences where user_id = auth.uid())
  );
  create policy "gtm_provider_accounts_owner" on gtm_provider_accounts for all using (auth.uid() = user_id);
  create policy "gtm_outreach_logs_owner" on gtm_outreach_logs for all using (auth.uid() = user_id);
  create policy "gtm_analytics_events_owner" on gtm_analytics_events for all using (auth.uid() = user_id);
  create policy "gtm_suppressions_owner" on gtm_suppressions for all using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- Indexes for common queries
create index if not exists idx_gtm_leads_user_status on gtm_leads(user_id, status);
create index if not exists idx_gtm_leads_list on gtm_leads(list_id);
create index if not exists idx_gtm_campaigns_user on gtm_campaigns(user_id, status);
create index if not exists idx_gtm_analytics_campaign on gtm_analytics_events(campaign_id, event_type);
create index if not exists idx_gtm_analytics_lead on gtm_analytics_events(lead_id);
create index if not exists idx_gtm_outreach_logs_campaign on gtm_outreach_logs(campaign_id);
create index if not exists idx_gtm_analytics_dedup on gtm_analytics_events(provider_event_id);
