-- Credit usage log
CREATE TABLE IF NOT EXISTS public.credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL DEFAULT 1,
  reason TEXT DEFAULT 'generation',
  credits_before INTEGER,
  credits_after INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.credit_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own usage" ON public.credit_usage
  FOR SELECT USING (auth.uid() = user_id);
GRANT ALL ON public.credit_usage TO authenticated;

-- Add monthly reset trigger
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void AS $$
BEGIN
  -- Free plan: 50 credits
  UPDATE public.profiles 
  SET credits = 50 
  WHERE plan = 'free' OR plan IS NULL;
  
  -- Starter: 500 credits
  UPDATE public.profiles 
  SET credits = 500 
  WHERE plan = 'starter';
  
  -- Pro: 2000 credits
  UPDATE public.profiles 
  SET credits = 2000 
  WHERE plan = 'pro';
  
  -- Teams: unlimited (set high)
  UPDATE public.profiles 
  SET credits = 99999 
  WHERE plan = 'teams';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
