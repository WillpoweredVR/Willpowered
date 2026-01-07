-- Add tasks column to profiles table for admin task management
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tasks JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.profiles.tasks IS 'Array of tasks linked to scorecard metrics - admin feature';

-- Create index for better query performance on tasks
CREATE INDEX IF NOT EXISTS idx_profiles_tasks ON public.profiles USING GIN (tasks);
