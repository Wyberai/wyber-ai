-- ============================================================
-- WyberAI Cloud: Managed Postgres databases via Railway
-- ============================================================
-- Tracks auto-provisioned Postgres instances and monthly usage
-- for billing. Credentials are encrypted and stored in project_connectors.

-- ── CLOUD_DATABASES ──────────────────────────────────────────
-- Track each provisioned Railway Postgres database
create table if not exists public.cloud_databases (
  id                    uuid primary key default uuid_generate_v4(),
  wyber_project_id      uuid unique not null references public.projects(id) on delete cascade,
  user_id               uuid not null references public.profiles(id) on delete cascade,

  -- Railway service identifiers
  railway_project_id    text not null,
  railway_environment   text not null default 'production',
  railway_service_id    text not null,

  -- Database connection details (decrypted/validated at access time)
  db_host               text,
  db_port               int,
  db_name               text not null,
  db_user               text not null,
  -- Note: db_pass_encrypted and postgres_url_encrypted are stored in
  -- project_connectors table (service='cloud-database') for consistent
  -- credential management and encryption, not duplicated here.

  -- Region/tier info for scaling decisions
  region                text not null default 'us-east-1',
  db_tier               text not null default 'micro', -- micro | small | medium | large

  -- Lifecycle and status
  status                text not null default 'provisioning', -- provisioning | ready | deleting | deleted | failed
  status_message        text,

  -- Backup metadata
  last_backup_at        timestamptz,
  backup_retention_days int not null default 7,

  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),
  deleted_at            timestamptz
);

alter table public.cloud_databases enable row level security;
drop policy if exists "users read own cloud_databases" on public.cloud_databases;
create policy "users read own cloud_databases"
  on public.cloud_databases for select
  using (auth.uid() = user_id);
drop policy if exists "users see project cloud databases" on public.cloud_databases;
create policy "users see project cloud databases"
  on public.cloud_databases for select
  using (auth.uid() = user_id);

-- ── CLOUD_DATABASE_USAGE ─────────────────────────────────────
-- Monthly usage metrics for billing (compute, storage, connections)
create table if not exists public.cloud_database_usage (
  id                    uuid primary key default uuid_generate_v4(),
  cloud_database_id     uuid not null references public.cloud_databases(id) on delete cascade,
  user_id               uuid not null references public.profiles(id) on delete cascade,

  -- Period
  billing_month         date not null, -- normalized to first of month

  -- Metrics from Railway
  compute_hours         decimal(10, 2) not null default 0, -- fractional CPU hours
  storage_gb            decimal(10, 2) not null default 0,
  connections_peak      int not null default 0,
  data_transfer_gb      decimal(10, 2) not null default 0,

  -- Billing summary
  credits_charged       int not null default 0,
  cost_cents            int not null default 0, -- in cents; Railway cost that WyberAI paid

  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),

  unique (cloud_database_id, billing_month)
);

alter table public.cloud_database_usage enable row level security;
drop policy if exists "users read own cloud_database_usage" on public.cloud_database_usage;
create policy "users read own cloud_database_usage"
  on public.cloud_database_usage for select
  using (auth.uid() = user_id);

-- ── CLOUD_BACKUPS ───────────────────────────────────────────────
-- Track point-in-time restores available for each database
create table if not exists public.cloud_backups (
  id                    uuid primary key default uuid_generate_v4(),
  cloud_database_id     uuid not null references public.cloud_databases(id) on delete cascade,

  -- Railway backup ref (used to restore)
  railway_backup_id     text not null,

  -- Metadata
  size_bytes            bigint,
  backup_at             timestamptz not null,
  expires_at            timestamptz not null,

  created_at            timestamptz default now(),

  unique (cloud_database_id, railway_backup_id)
);

alter table public.cloud_backups enable row level security;
drop policy if exists "users read own cloud_backups" on public.cloud_backups;
create policy "users read own cloud_backups"
  on public.cloud_backups for select
  using (
    exists (
      select 1 from public.cloud_databases cd
      where cd.id = cloud_backups.cloud_database_id
        and cd.user_id = auth.uid()
    )
  );

-- ── CLOUD_QUERY_LOGS ─────────────────────────────────────────
-- Audit trail of all queries executed against cloud databases
create table if not exists public.cloud_query_logs (
  id                    uuid primary key default uuid_generate_v4(),
  wyber_project_id      uuid not null references public.projects(id) on delete cascade,
  user_id               uuid not null references public.profiles(id) on delete cascade,

  -- Query details
  query                 text not null,
  type                  text,                           -- 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  rows_affected         int not null default 0,
  error                 text,
  execution_time_ms     int,

  -- Timing
  executed_at           timestamptz default now(),
  created_at            timestamptz default now()
);

alter table public.cloud_query_logs enable row level security;
drop policy if exists "users read own cloud_query_logs" on public.cloud_query_logs;
create policy "users read own cloud_query_logs"
  on public.cloud_query_logs for select
  using (auth.uid() = user_id);

-- ── CLOUD_SECRETS ─────────────────────────────────────────────
-- Encrypted environment variables per cloud database
create table if not exists public.cloud_secrets (
  id                    uuid primary key default uuid_generate_v4(),
  wyber_project_id      uuid not null references public.projects(id) on delete cascade,
  user_id               uuid not null references public.profiles(id) on delete cascade,

  -- Secret metadata
  key                   text not null,                  -- e.g., 'API_KEY', 'DATABASE_PASSWORD'
  value                 text not null,                  -- AES-256-GCM encrypted value

  -- Lifecycle
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),

  unique (wyber_project_id, key)
);

alter table public.cloud_secrets enable row level security;
drop policy if exists "users manage own cloud_secrets" on public.cloud_secrets;
create policy "users manage own cloud_secrets"
  on public.cloud_secrets for all
  using (auth.uid() = user_id);

-- ── INDICES ──────────────────────────────────────────────────
create index if not exists idx_cloud_databases_user_id on public.cloud_databases(user_id);
create index if not exists idx_cloud_databases_status on public.cloud_databases(status);
create index if not exists idx_cloud_database_usage_user_id on public.cloud_database_usage(user_id);
create index if not exists idx_cloud_database_usage_billing_month on public.cloud_database_usage(billing_month);
create index if not exists idx_cloud_backups_backup_at on public.cloud_backups(backup_at);
create index if not exists idx_cloud_query_logs_user_id on public.cloud_query_logs(user_id);
create index if not exists idx_cloud_query_logs_executed_at on public.cloud_query_logs(executed_at);
create index if not exists idx_cloud_secrets_user_id on public.cloud_secrets(user_id);
