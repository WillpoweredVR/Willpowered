-- Add columns for tracking last email sent times to prevent duplicate sends

-- Track when we last sent the daily scorecard email
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_daily_email_at TIMESTAMPTZ;

-- Track when we last sent the weekly principles email  
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_weekly_email_at TIMESTAMPTZ;

-- Add comments
COMMENT ON COLUMN profiles.last_daily_email_at IS 'Timestamp of last daily scorecard email sent - used for deduplication';
COMMENT ON COLUMN profiles.last_weekly_email_at IS 'Timestamp of last weekly principles email sent - used for deduplication';
