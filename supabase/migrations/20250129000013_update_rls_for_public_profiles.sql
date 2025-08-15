-- Update RLS policies for public access to user profiles and mosques
-- This migration makes profiles and mosques publicly viewable like social media
-- unless marked as private

-- Add privacy field to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS is_profile_private boolean DEFAULT false;

-- Add privacy field to mosques table
ALTER TABLE public.mosques 
ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false;

-- Drop existing restrictive policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Public can view public profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Drop existing restrictive policies for mosques
DROP POLICY IF EXISTS "Users can view own mosques" ON public.mosques;
DROP POLICY IF EXISTS "Public can view public mosques" ON public.mosques;
DROP POLICY IF EXISTS "Mosque owners can update" ON public.mosques;
DROP POLICY IF EXISTS "Users can create mosques" ON public.mosques;
DROP POLICY IF EXISTS "Users can delete own mosques" ON public.mosques;

-- Create new public access policies for user_profiles
-- Allow everyone (including anonymous users) to view public profiles
CREATE POLICY "Public can view public profiles" ON public.user_profiles
  FOR SELECT USING (
    is_profile_private = false OR is_profile_private IS NULL
  );

-- Allow users to view their own profile (even if private)
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Keep existing update and insert policies for user_profiles
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create new public access policies for mosques
-- Allow everyone (including anonymous users) to view public mosques
CREATE POLICY "Public can view public mosques" ON public.mosques
  FOR SELECT USING (
    is_private = false OR is_private IS NULL
  );

-- Allow mosque owners to view their own mosques (even if private)
CREATE POLICY "Users can view own mosques" ON public.mosques
  FOR SELECT USING (auth.uid() = user_id);

-- Keep existing management policies for mosques
CREATE POLICY "Mosque owners can update" ON public.mosques
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can create mosques" ON public.mosques
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mosques" ON public.mosques
  FOR DELETE USING (auth.uid() = user_id);

-- Grant SELECT permissions to anonymous users for public access
GRANT SELECT ON public.user_profiles TO anon;
GRANT SELECT ON public.mosques TO anon;

-- Ensure authenticated users also have access
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.mosques TO authenticated;

-- Update existing grants to include the new columns
GRANT UPDATE (is_profile_private) ON public.user_profiles TO authenticated;
GRANT UPDATE (is_private) ON public.mosques TO authenticated;

-- Add helpful comments
COMMENT ON COLUMN public.user_profiles.is_profile_private IS 'When true, profile is only visible to the user themselves';
COMMENT ON COLUMN public.mosques.is_private IS 'When true, mosque is only visible to the owner';