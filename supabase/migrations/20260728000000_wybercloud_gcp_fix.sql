-- ============================================================
-- WyberCloud: fix schema for Google Cloud SQL (was Railway-shaped)
-- ============================================================
-- The original 20260727000000_cloud_databases.sql migration modeled
-- cloud_databases around Railway (railway_project_id/railway_service_id
-- NOT NULL), but the provisioning code writes Google Cloud SQL fields
-- (gcp_instance_name) instead. This migration reconciles the schema and
-- grants the table access the API routes need (authenticated role was
-- missing SELECT/INSERT/UPDATE grants entirely, causing
-- "permission denied for table cloud_databases" in production).

-- ── Make Railway columns optional, add GCP + async-operation columns ──
alter table public.cloud_databases
  alter column railway_project_id drop not null,
  alter column railway_service_id drop not null;

alter table public.cloud_databases
  add column if not exists gcp_instance_name text,
  add column if not exists operation_name text; -- Cloud SQL Admin operation, used to poll provisioning status

create unique index if not exists idx_cloud_databases_gcp_instance_name
  on public.cloud_databases(gcp_instance_name)
  where gcp_instance_name is not null;

-- ── Grants ────────────────────────────────────────────────────
-- RLS policies alone are not enough — Postgres also requires the role
-- to have base table privileges before RLS is even evaluated.
grant select, insert, update, delete on public.cloud_databases to authenticated;
grant select, insert, update, delete on public.cloud_database_usage to authenticated;
grant select, insert on public.cloud_backups to authenticated;
grant select, insert, update, delete on public.cloud_query_logs to authenticated;
grant select, insert, update, delete on public.cloud_secrets to authenticated;

-- service_role (used by createAdminClient() in the API routes) bypasses
-- RLS by default, but still needs base grants under `security invoker`-style
-- setups; grant explicitly so behavior doesn't depend on Supabase defaults.
grant select, insert, update, delete on public.cloud_databases to service_role;
grant select, insert, update, delete on public.cloud_database_usage to service_role;
grant select, insert, update, delete on public.cloud_backups to service_role;
grant select, insert, update, delete on public.cloud_query_logs to service_role;
grant select, insert, update, delete on public.cloud_secrets to service_role;

-- ── Insert/update policies were missing (original migration only added SELECT) ──
-- Postgres has no "CREATE POLICY IF NOT EXISTS"; drop-then-create instead.
drop policy if exists "users insert own cloud_databases" on public.cloud_databases;
create policy "users insert own cloud_databases"
  on public.cloud_databases for insert
  with check (auth.uid() = user_id);

drop policy if exists "users update own cloud_databases" on public.cloud_databases;
create policy "users update own cloud_databases"
  on public.cloud_databases for update
  using (auth.uid() = user_id);
