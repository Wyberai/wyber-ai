-- THE RULE: a design that exists is never built again, for anyone, unless the user asked for exactly the same thing.
-- Every build claims a design fingerprint (design direction, font pairing, corner radius, colour bucket, page layout) before it is built.
-- The primary key makes the claim atomic: two builds at the same moment can never both get one. Written only by server code (service role).
-- NOT applied to production: review, then run it by hand. Until it is applied the app still builds, without the uniqueness check.

create table if not exists public.design_fingerprints (
  key text primary key,
  owner text not null,
  direction_id text not null,
  industry text,
  created_at timestamptz not null default now()
);
create index if not exists design_fingerprints_direction_idx on public.design_fingerprints (direction_id, created_at desc);

alter table public.design_fingerprints enable row level security;
-- no policies for signed-in people: nothing here is theirs to read or write
revoke all on public.design_fingerprints from anon, authenticated;
grant all on public.design_fingerprints to service_role;
