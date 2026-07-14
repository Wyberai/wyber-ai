-- ============================================================
-- Migration: OAuth 2.0 authorization server for the MCP connector
-- ============================================================
-- WyberAi acts as its own OAuth 2.0 authorization server so the MCP server at
-- /api/mcp can be listed in the Claude Connectors Directory (which requires
-- OAuth with per-user consent). Backs Dynamic Client Registration (RFC 7591),
-- the authorization-code grant with PKCE S256, and refresh tokens. Access
-- tokens are HMAC-signed (stateless) and are NOT stored; only auth codes and
-- refresh tokens are persisted (hashed). All access is via the service role.

-- Registered OAuth clients (Claude registers one per fresh connection via DCR).
create table if not exists public.oauth_clients (
  client_id     text primary key,
  client_name   text,
  redirect_uris text[] not null default '{}',
  created_at    timestamptz not null default now()
);

-- Short-lived, single-use authorization codes (5 min TTL). Stored hashed.
create table if not exists public.oauth_codes (
  code_hash      text primary key,
  client_id      text not null,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  redirect_uri   text not null,
  code_challenge text not null,          -- PKCE S256 challenge
  scope          text,
  expires_at     timestamptz not null,
  created_at     timestamptz not null default now()
);

-- Rotating refresh tokens (30 day TTL). Stored hashed; rotated on every use.
create table if not exists public.oauth_refresh_tokens (
  token_hash  text primary key,
  client_id   text not null,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  scope       text,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_oauth_codes_expires  on public.oauth_codes(expires_at);
create index if not exists idx_oauth_rt_user         on public.oauth_refresh_tokens(user_id);
create index if not exists idx_oauth_rt_expires      on public.oauth_refresh_tokens(expires_at);

-- Service-role only: the OAuth endpoints all use the service client. Enable RLS
-- with no policies so the anon/authenticated keys can never read these tables.
alter table public.oauth_clients        enable row level security;
alter table public.oauth_codes          enable row level security;
alter table public.oauth_refresh_tokens enable row level security;
