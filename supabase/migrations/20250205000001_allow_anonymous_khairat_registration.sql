-- Allow anonymous users (non-logged in) to insert khairat_members records
-- This enables registration without requiring login

-- Grant INSERT permission to anon role
GRANT INSERT ON public.khairat_members TO anon;

-- Policy: Allow anonymous users to insert records with NULL user_id
-- This is for users who register without logging in
-- Note: auth.uid() will be NULL for anonymous users
DROP POLICY IF EXISTS "Anonymous users can insert khairat records" ON public.khairat_members;
CREATE POLICY "Anonymous users can insert khairat records" ON public.khairat_members
  FOR INSERT 
  TO anon
  WITH CHECK (
    user_id IS NULL
    AND ic_passport_number IS NOT NULL
    AND full_name IS NOT NULL
  );

-- Policy: Allow anonymous users to view records with NULL user_id
-- Note: This is limited - anonymous users can't easily track their records
-- They should be encouraged to log in for better tracking
DROP POLICY IF EXISTS "Anonymous users can view khairat records" ON public.khairat_members;
CREATE POLICY "Anonymous users can view khairat records" ON public.khairat_members
  FOR SELECT 
  TO anon
  USING (
    user_id IS NULL
  );

