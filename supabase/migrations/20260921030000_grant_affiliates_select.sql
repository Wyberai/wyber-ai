-- Real root cause of the affiliate dashboard showing "Apply now" forever:
-- confirmed live via a temporary diagnostic route that the session-scoped
-- read was failing with Postgres error 42501 "permission denied for table
-- affiliates" — not an RLS policy problem (the previous hotfix migration,
-- 20260921020000, re-created the policy and did not help, because the
-- `authenticated` role never had a base GRANT on these tables at all. RLS
-- policies are only consulted after the base privilege check passes; with
-- no GRANT, Postgres denies before RLS is even in the picture. The apply
-- flow appeared to work because /api/affiliate/apply uses the service-role
-- client, which bypasses both grants and RLS.

grant select on public.affiliates to authenticated;
grant select on public.affiliate_commissions to authenticated;
