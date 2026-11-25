-- Domains + Google Workspace (ResellerClub). NOT applied to production: review, then run it by hand.
-- Writes happen only from server code with the service role; signed-in people can read their own rows.
-- Base GRANTs are explicit on purpose: RLS policies do nothing if the role has no table privilege.

create table if not exists public.reseller_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rc_customer_id bigint,
  rc_contact_id bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.commerce_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('domain', 'workspace')),
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment', 'registering', 'active', 'needs_attention', 'cancelled')),
  domain text not null,
  project_id uuid,
  years int,
  months int,
  seats int,
  region text,
  registry_cents int not null check (registry_cents >= 0),
  margin_cents int not null check (margin_cents >= 0),
  total_cents int not null check (total_cents = registry_cents + margin_cents),
  currency text not null default 'USD',
  contact jsonb not null,
  policy_version text not null,
  rc_order_id bigint,
  dodo_checkout_id text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists commerce_orders_user_idx on public.commerce_orders(user_id, created_at desc);
create index if not exists commerce_orders_status_idx on public.commerce_orders(status);

create table if not exists public.managed_domains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid,
  domain text not null unique,
  rc_order_id bigint not null,
  expires_at timestamptz,
  dns_written boolean not null default false,
  vercel_attached boolean not null default false,
  reminders_sent int[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists managed_domains_user_idx on public.managed_domains(user_id);
create index if not exists managed_domains_expiry_idx on public.managed_domains(expires_at);

create table if not exists public.workspace_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  domain text not null unique,
  rc_order_id bigint not null,
  region text not null,
  seats int not null check (seats >= 1),
  admin_email text,
  records jsonb,
  expires_at timestamptz,
  reminders_sent int[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists workspace_subscriptions_user_idx on public.workspace_subscriptions(user_id);
create index if not exists workspace_subscriptions_expiry_idx on public.workspace_subscriptions(expires_at);

alter table public.reseller_customers enable row level security;
alter table public.commerce_orders enable row level security;
alter table public.managed_domains enable row level security;
alter table public.workspace_subscriptions enable row level security;

drop policy if exists "own orders" on public.commerce_orders;
create policy "own orders" on public.commerce_orders for select to authenticated using (user_id = auth.uid());
drop policy if exists "own domains" on public.managed_domains;
create policy "own domains" on public.managed_domains for select to authenticated using (user_id = auth.uid());
drop policy if exists "own workspace" on public.workspace_subscriptions;
create policy "own workspace" on public.workspace_subscriptions for select to authenticated using (user_id = auth.uid());
-- reseller_customers holds provider ids only the server needs: no policy for signed-in users.

revoke all on public.reseller_customers, public.commerce_orders, public.managed_domains, public.workspace_subscriptions from anon, authenticated;
grant select on public.commerce_orders, public.managed_domains, public.workspace_subscriptions to authenticated;
grant all on public.reseller_customers, public.commerce_orders, public.managed_domains, public.workspace_subscriptions to service_role;
