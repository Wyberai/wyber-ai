-- Hotfix: the affiliate dashboard (src/app/affiliate/dashboard/page.tsx)
-- reads via the session-scoped client, relying on the SELECT policy from
-- 20260922000000_affiliates.sql. Confirmed live: a real affiliate row
-- existed (visible via service-role) but the RLS-scoped page query
-- returned nothing for its own owner. Postgres has no
-- `create policy if not exists`, so a migration re-run (or a partial first
-- run) can silently leave this specific statement not applied while
-- everything else in the file succeeds. Drop-then-recreate is idempotent
-- and safe to run any number of times.

drop policy if exists "user can view own affiliate row" on public.affiliates;
create policy "user can view own affiliate row"
  on public.affiliates for select
  using (auth.uid() = user_id);

drop policy if exists "affiliate can view own commissions" on public.affiliate_commissions;
create policy "affiliate can view own commissions"
  on public.affiliate_commissions for select
  using (exists (select 1 from public.affiliates where id = affiliate_id and user_id = auth.uid()));
