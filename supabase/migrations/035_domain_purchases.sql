-- Real domain purchasing (vs. free *.wyberai.app subdomains in projects.custom_domain).
-- A row is created pending at checkout time and confirmed by the Dodo webhook
-- once payment succeeds, which then calls the Vercel Domains "buy" API.

create table if not exists public.domain_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  domain text not null,
  price_cents integer not null,
  status text not null default 'pending', -- pending | purchased | failed
  dodo_checkout_id text,
  created_at timestamptz not null default now(),
  purchased_at timestamptz
);

create index if not exists domain_purchases_user_idx on public.domain_purchases(user_id);
create index if not exists domain_purchases_status_idx on public.domain_purchases(status);

alter table public.domain_purchases enable row level security;

create policy "Users can view their own domain purchases"
  on public.domain_purchases for select
  using (auth.uid() = user_id);
