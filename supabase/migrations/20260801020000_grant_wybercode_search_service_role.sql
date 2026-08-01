-- 20260801000000 revoked EXECUTE on search_wybercode_templates from
-- public/anon/authenticated but that also revokes the implicit grant
-- service_role gets through PUBLIC — exact same gap deduct_credits/
-- adjust_credits hit once already (see
-- 20260703090000_grant_credit_fns_service_role.sql). Confirmed live: the
-- admin client got a 403 calling this RPC via PostgREST immediately after
-- 20260801000000 was applied. Fixed at the source in that migration file too
-- (for a fresh database), but the already-applied production database needs
-- this run separately.
--
-- ⚠ MUST BE RUN MANUALLY in the Supabase dashboard SQL editor (the CLI on
-- the dev machine is linked to a different Supabase account).

grant execute on function search_wybercode_templates(text, text, text, int) to service_role;
