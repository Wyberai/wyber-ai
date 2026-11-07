-- Fix: daily drip cap must not claw back manually added credits.
-- Old behaviour: LEAST(credits + drip, 60) → collapses 500 top-up back to 60 overnight.
-- New behaviour: only cap the drip itself; if credits already exceed the cap, leave them alone.
-- Formula: LEAST(credits + daily_credits, GREATEST(credits, 60))
--   credits=55  → LEAST(60,  60) = 60   ✓ drip topped up to cap
--   credits=300 → LEAST(305, 300) = 300 ✓ manual top-up untouched
--   credits=58  → LEAST(63,  60) = 60   ✓ capped correctly

CREATE OR REPLACE FUNCTION add_daily_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Free plan: cap drip at 60, but never reduce credits already above the cap
  UPDATE profiles
  SET credits    = LEAST(credits + daily_credits, GREATEST(credits, 60)),
      updated_at = now()
  WHERE daily_credits > 0
    AND plan = 'free';

  -- Paid plans: no cap
  UPDATE profiles
  SET credits    = credits + daily_credits,
      updated_at = now()
  WHERE daily_credits > 0
    AND plan != 'free';
END;
$$;
