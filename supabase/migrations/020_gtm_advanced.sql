-- GTM advanced features: A/B tests, CRM sync logs, intent signals on leads

-- A/B tests table
create table if not exists gtm_ab_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references gtm_campaigns(id) on delete cascade,
  variant_a jsonb not null default '{}',
  variant_b jsonb not null default '{}',
  results_a jsonb,
  results_b jsonb,
  metric text not null default 'reply_rate',
  winner text check (winner in ('a','b')),
  winner_reason text,
  status text not null default 'running' check (status in ('running','completed','paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table gtm_ab_tests enable row level security;
create policy "Users manage own ab tests" on gtm_ab_tests for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- CRM sync logs
create table if not exists gtm_crm_sync_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  crm text not null,
  synced integer not null default 0,
  errors jsonb not null default '[]',
  synced_at timestamptz not null default now()
);
alter table gtm_crm_sync_logs enable row level security;
create policy "Users view own crm logs" on gtm_crm_sync_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Intent signals on leads (columns)
alter table gtm_leads add column if not exists intent_score integer default 0;
alter table gtm_leads add column if not exists intent_signals jsonb default '[]';
alter table gtm_leads add column if not exists intent_detected_at timestamptz;
alter table gtm_leads add column if not exists enrichment_data jsonb default '{}';
alter table gtm_leads add column if not exists score_tier text;
alter table gtm_leads add column if not exists score_reason text;
alter table gtm_leads add column if not exists scored_at timestamptz;

-- Sequence enrollments (create if not exists, then add new column)
create table if not exists gtm_sequence_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sequence_id uuid not null references gtm_sequences(id) on delete cascade,
  lead_id uuid not null references gtm_leads(id) on delete cascade,
  status text not null default 'active' check (status in ('active','paused','completed','replied','bounced','unsubscribed')),
  current_step integer not null default 0,
  last_action_at timestamptz,
  completed_at timestamptz,
  step_results jsonb not null default '{}',
  branch_taken text,
  created_at timestamptz not null default now(),
  unique(sequence_id, lead_id)
);
alter table gtm_sequence_enrollments enable row level security;
create policy "Users manage own enrollments" on gtm_sequence_enrollments for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists gtm_seq_enroll_user_idx on gtm_sequence_enrollments(user_id, status);

-- Add branch_taken if table already existed without it
alter table gtm_sequence_enrollments add column if not exists branch_taken text;

-- Campaign active variant for A/B
alter table gtm_campaigns add column if not exists active_variant text check (active_variant in ('a','b'));
