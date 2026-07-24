-- Fixes a real bug found while verifying the marketplace: RLS policies alone
-- don't grant access in Postgres — you also need the base table-level GRANT
-- for the role, or every query gets "permission denied for table X" even
-- when a matching RLS policy would have allowed the row. The previous
-- migration (20260724000000_marketplace.sql) added RLS policies but never
-- the underlying GRANTs, so:
--   - /marketplace (public, unauthenticated) never actually hit this, since
--     it reads via the service-role client (bypasses grants and RLS both).
--   - /marketplace/sell DID hit this: it reads the seller's own listings via
--     the session-bound (authenticated-role) client, which was silently
--     failing and showing an empty "your submissions" list.
--
-- This mirrors an identical, pre-existing gap on challenge_entries from an
-- earlier migration — not a new pattern, just finishing what RLS-only
-- policies never actually enabled by themselves. Table-level GRANT does not
-- loosen anything: RLS still filters every row exactly as already defined.

GRANT SELECT ON public.marketplace_listings TO anon, authenticated;
GRANT SELECT ON public.marketplace_purchases TO authenticated;
