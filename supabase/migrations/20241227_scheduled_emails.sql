-- Create scheduled_emails table for email sequence management
CREATE TABLE IF NOT EXISTS scheduled_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type VARCHAR(50) NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient querying of pending emails
CREATE INDEX idx_scheduled_emails_pending 
ON scheduled_emails (scheduled_for) 
WHERE status = 'pending';

-- Create index for user lookup
CREATE INDEX idx_scheduled_emails_user 
ON scheduled_emails (user_id);

-- Create index for email type
CREATE INDEX idx_scheduled_emails_type 
ON scheduled_emails (email_type);

-- Add RLS policies
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;

-- Only service role can access (for cron jobs)
CREATE POLICY "Service role can manage scheduled emails"
ON scheduled_emails
FOR ALL
USING (auth.role() = 'service_role');

-- Add email_sequence_started to profiles to track if user has been added to sequence
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email_sequence_started BOOLEAN DEFAULT FALSE;

-- Add email_preferences to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{
  "marketing": true,
  "product_updates": true,
  "onboarding_sequence": true,
  "weekly_summary": true,
  "checkin_reminders": true
}'::jsonb;

-- Create function to schedule onboarding emails for new users
CREATE OR REPLACE FUNCTION schedule_onboarding_emails()
RETURNS TRIGGER AS $$
BEGIN
  -- Only schedule if not already started and onboarding sequence is enabled
  IF NOT NEW.email_sequence_started 
     AND (NEW.email_preferences->>'onboarding_sequence')::boolean IS NOT FALSE THEN
    
    -- Day 1 email (24 hours after signup)
    INSERT INTO scheduled_emails (user_id, email_type, scheduled_for, metadata)
    VALUES (
      NEW.id, 
      'day_1_activation', 
      NOW() + INTERVAL '24 hours',
      jsonb_build_object('user_name', COALESCE(NEW.full_name, 'there'))
    );
    
    -- Day 3 email (72 hours after signup)
    INSERT INTO scheduled_emails (user_id, email_type, scheduled_for, metadata)
    VALUES (
      NEW.id, 
      'day_3_engagement', 
      NOW() + INTERVAL '72 hours',
      jsonb_build_object('user_name', COALESCE(NEW.full_name, 'there'))
    );
    
    -- Day 7 email (168 hours after signup)
    INSERT INTO scheduled_emails (user_id, email_type, scheduled_for, metadata)
    VALUES (
      NEW.id, 
      'day_7_milestone', 
      NOW() + INTERVAL '168 hours',
      jsonb_build_object('user_name', COALESCE(NEW.full_name, 'there'))
    );
    
    -- Mark sequence as started
    NEW.email_sequence_started := TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new profile creation
DROP TRIGGER IF EXISTS trigger_schedule_onboarding_emails ON profiles;
CREATE TRIGGER trigger_schedule_onboarding_emails
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION schedule_onboarding_emails();

-- Create function to update scheduled_emails.updated_at
CREATE OR REPLACE FUNCTION update_scheduled_emails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_scheduled_emails_updated_at
BEFORE UPDATE ON scheduled_emails
FOR EACH ROW
EXECUTE FUNCTION update_scheduled_emails_updated_at();



