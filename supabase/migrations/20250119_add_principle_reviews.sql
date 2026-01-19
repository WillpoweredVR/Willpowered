-- Add principle_reviews column to profiles table for storing weekly principle review data
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS principle_reviews JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN profiles.principle_reviews IS 'Stores weekly principle review entries as JSON array';
