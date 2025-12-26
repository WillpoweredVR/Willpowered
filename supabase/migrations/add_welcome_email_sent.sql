-- Add welcome_email_sent column to profiles table
-- This tracks whether we've sent the welcome email to prevent duplicates

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE;

-- Add index for faster lookups (optional, but helpful for batch operations)
CREATE INDEX IF NOT EXISTS idx_profiles_welcome_email_sent 
ON profiles(welcome_email_sent) 
WHERE welcome_email_sent = FALSE;

