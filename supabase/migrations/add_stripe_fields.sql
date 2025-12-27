-- Add Stripe subscription fields to profiles table
-- Run this migration in your Supabase SQL editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_trial_end TIMESTAMPTZ;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
ON profiles(stripe_customer_id);

-- Add comment for documentation
COMMENT ON COLUMN profiles.subscription_status IS 
'Subscription status: free, trialing, active, past_due, canceled, unpaid, incomplete, expired, paused';



