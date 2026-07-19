-- 20260702130000 created deduct_credits/adjust_credits and revoked EXECUTE
-- from public/anon/authenticated — but never granted it back to service_role,
-- which only had it via the default PUBLIC grant. Result on prod: BOTH RPCs
-- return "42501 permission denied" even for the admin client, so every charge
-- and top-up silently used the racy read-then-write fallback the functions
-- were built to replace.
--
-- ⚠ MUST BE RUN MANUALLY in the Supabase dashboard SQL editor (the CLI on the
-- dev machine is linked to a different Supabase account).

grant execute on function deduct_credits(uuid, integer) to service_role;
grant execute on function adjust_credits(uuid, integer) to service_role;
