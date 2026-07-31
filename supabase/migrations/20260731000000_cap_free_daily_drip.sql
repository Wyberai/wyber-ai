-- Cap the free-tier daily credit drip at 60 credits.
-- Without this, inactive free users accumulate credits indefinitely,
-- eliminating any urgency to upgrade or even try building.
-- Paid users are uncapped (their daily_credits are a plan perk, not a trial mechanic).
CREATE OR REPLACE FUNCTION add_daily_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Free plan: cap at 60 so inactive users don't drift above their starting balance
  UPDATE profiles
  SET credits = LEAST(credits + daily_credits, 60)
  WHERE daily_credits > 0
    AND plan = 'free';

  -- Paid plans: no cap
  UPDATE profiles
  SET credits = credits + daily_credits
  WHERE daily_credits > 0
    AND plan != 'free';
END;
$$;
