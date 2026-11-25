-- API keys for AI agents: an access level (full or read-only) and an optional expiry.
-- Every existing key becomes "full" with no expiry, exactly as it behaves today. Safe to run twice; nothing is deleted.

alter table public.api_keys add column if not exists scope text not null default 'full';
alter table public.api_keys add column if not exists expires_at timestamptz;

do $$
begin
  alter table public.api_keys add constraint api_keys_scope_check check (scope in ('full', 'read'));
exception when duplicate_object then null;
end $$;

create index if not exists idx_api_keys_user_active on public.api_keys (user_id) where active;
