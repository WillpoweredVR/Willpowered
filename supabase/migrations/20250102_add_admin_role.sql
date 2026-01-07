-- Add is_admin column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- Set initial admin users by email
-- Note: Run this after the column is added
UPDATE profiles 
SET is_admin = true 
WHERE email IN ('colin.robertson3@gmail.com', 'colin@willpowered.com');

COMMENT ON COLUMN profiles.is_admin IS 'Whether this user has admin privileges';
