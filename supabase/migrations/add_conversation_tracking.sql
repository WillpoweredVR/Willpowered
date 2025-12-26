-- Add conversation tracking fields to profiles table
-- Run this migration in your Supabase SQL editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS monthly_conversations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS conversation_reset_date TIMESTAMPTZ DEFAULT NOW();

-- Comment for documentation
COMMENT ON COLUMN profiles.monthly_conversations IS 
'Number of AI coaching conversations used this month. Resets monthly for free users.';

COMMENT ON COLUMN profiles.conversation_reset_date IS 
'Date when monthly_conversations was last reset. Used to determine when to reset the count.';



