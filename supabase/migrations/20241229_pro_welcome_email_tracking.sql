-- Add pro_welcome_email_sent column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS pro_welcome_email_sent BOOLEAN DEFAULT FALSE;

-- Set to true for existing Pro users (they've already been welcomed)
UPDATE profiles 
SET pro_welcome_email_sent = TRUE 
WHERE subscription_status IN ('active', 'trialing');

