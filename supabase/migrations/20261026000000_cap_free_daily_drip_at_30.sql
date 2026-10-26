-- Cap the free-tier daily credit drip at 30 — the current signup grant.
--
-- 20260731000000 capped the drip at 60, the signup grant at the time ("so
-- inactive users don't drift above their starting balance"). On 2026-09-16
-- the signup grant was cut to 30 (20260916000000) but this cap stayed at 60,
-- so every free account drifted from 30 back up to 60 within ~6 days —
-- silently undoing the cut. Founder decision 2026-10-26: cap at 30.
--
-- Also fixes a side effect of the old version: SET credits = LEAST(credits +
-- daily_credits, cap) on EVERY free row pulled anyone already above the cap
-- (bonuses, top-ups, older grants) down to it. The drip now only ever ADDS,
-- and only to accounts below the cap. Existing balances above 30 are left
-- alone (founder decision) and simply stop receiving the drip.
--
-- ⚠ MUST BE RUN MANUALLY in the Supabase dashboard SQL editor (the CLI on the
-- dev machine is linked to a different Supabase account) — same as
-- 20260916000000_reduce_signup_credits_to_30.sql.

CREATE OR REPLACE FUNCTION add_daily_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Free plan: top up toward 30, never above it, never down to it.
  UPDATE profiles
  SET credits = LEAST(credits + daily_credits, 30)
  WHERE daily_credits > 0
    AND plan = 'free'
    AND credits < 30;

  -- Paid plans: no cap (their daily_credits are a plan perk).
  UPDATE profiles
  SET credits = credits + daily_credits
  WHERE daily_credits > 0
    AND plan != 'free';
END;
$$;
