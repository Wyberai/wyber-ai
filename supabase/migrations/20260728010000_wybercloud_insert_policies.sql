-- ============================================================
-- WyberCloud: add missing INSERT/UPDATE policies
-- ============================================================
-- The original migration only added SELECT policies for
-- cloud_query_logs / cloud_database_usage / cloud_backups. Writes to
-- these tables (e.g. logging every query a customer runs) were failing
-- with "new row violates row-level security policy" once base grants
-- were fixed and RLS actually started being enforced.

drop policy if exists "users insert own cloud_query_logs" on public.cloud_query_logs;
create policy "users insert own cloud_query_logs"
  on public.cloud_query_logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "users insert own cloud_database_usage" on public.cloud_database_usage;
create policy "users insert own cloud_database_usage"
  on public.cloud_database_usage for insert
  with check (auth.uid() = user_id);

drop policy if exists "users update own cloud_database_usage" on public.cloud_database_usage;
create policy "users update own cloud_database_usage"
  on public.cloud_database_usage for update
  using (auth.uid() = user_id);

drop policy if exists "users insert own cloud_backups" on public.cloud_backups;
create policy "users insert own cloud_backups"
  on public.cloud_backups for insert
  with check (
    exists (
      select 1 from public.cloud_databases cd
      where cd.id = cloud_backups.cloud_database_id
        and cd.user_id = auth.uid()
    )
  );
