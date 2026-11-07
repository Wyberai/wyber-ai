-- Internal CRM (see src/lib/crm). One row in crm_contacts is one opportunity:
-- a person or company, where they are in the sales pipeline, and what is next.
-- Fed by the expo form, signups, consultation bookings and CSV imports.
-- Service-role only (RLS on, no policies): used by /admin/crm and scripts.
create table if not exists crm_contacts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  email text,
  phone text,
  phone_norm text,                      -- last 10 digits, for dedupe
  company text,
  title text,
  country text,
  segment text not null default 'other' check (segment in ('business', 'software', 'student', 'other')),
  source text not null default 'manual', -- expo | signup | consult | apollo | whatsapp_list | referral | manual ...
  source_ref text,                       -- id in the source system, makes syncs idempotent
  stage text not null default 'new'
    check (stage in ('new', 'contacted', 'replied', 'meeting_booked', 'met', 'proposal', 'won', 'lost', 'nurture')),
  value_usd numeric not null default 0,  -- expected (open) or actual (won) deal value in USD
  score int not null default 0,
  tags text[] not null default '{}',
  next_action text,
  next_action_at timestamptz,
  last_touch_at timestamptz,
  closed_at timestamptz,
  lost_reason text,
  notes text
);
create unique index if not exists uq_crm_contacts_source_ref on crm_contacts (source, source_ref) where source_ref is not null;
create index if not exists idx_crm_contacts_stage on crm_contacts (stage, next_action_at);
create index if not exists idx_crm_contacts_email on crm_contacts (lower(email));
create index if not exists idx_crm_contacts_phone on crm_contacts (phone_norm);
alter table crm_contacts enable row level security;

create table if not exists crm_activities (
  id bigserial primary key,
  contact_id uuid not null references crm_contacts(id) on delete cascade,
  created_at timestamptz not null default now(),
  kind text not null default 'note' check (kind in ('note', 'call', 'whatsapp', 'email', 'meeting', 'system')),
  summary text not null,
  by text
);
create index if not exists idx_crm_activities_contact on crm_activities (contact_id, created_at desc);
alter table crm_activities enable row level security;
