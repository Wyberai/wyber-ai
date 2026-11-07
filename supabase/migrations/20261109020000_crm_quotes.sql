-- Quotes: a priced scope a client can open from a private link and accept.
-- Service-role only (RLS on, no policies); the public page and the accept route
-- go through the server, never straight to this table.
create table if not exists crm_quotes (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,            -- unguessable link token (24 random bytes, base64url)
  contact_id uuid references crm_contacts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  currency text not null default 'USD' check (currency in ('USD', 'INR')),
  items jsonb not null default '[]'::jsonb,      -- [{ description, qty, unit_price }]
  total numeric not null default 0,              -- always recomputed on the server from items
  scope text,                                    -- what will be built, plain text
  terms text,                                    -- founder-written payment and delivery terms
  valid_until date,
  status text not null default 'draft' check (status in ('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired')),
  sent_at timestamptz,
  viewed_at timestamptz,
  view_count int not null default 0,
  accepted_at timestamptz,
  accepted_by text                               -- name typed by the client when accepting
);
create index if not exists idx_crm_quotes_contact on crm_quotes (contact_id, created_at desc);
create index if not exists idx_crm_quotes_status on crm_quotes (status, created_at desc);
alter table crm_quotes enable row level security;
