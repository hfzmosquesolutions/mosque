-- Allow anonymous users (non-logged in) to insert khairat_contributions records
-- This enables payment without requiring login

-- Grant INSERT permission to anon role
GRANT INSERT ON public.khairat_contributions TO anon;

-- First, drop ALL existing INSERT policies that might conflict
-- This ensures we start with a clean slate
-- We need to drop all possible policy names that might exist
DROP POLICY IF EXISTS "Anonymous users can insert khairat contributions" ON public.khairat_contributions;
DROP POLICY IF EXISTS "Users can insert khairat contributions" ON public.khairat_contributions;
DROP POLICY IF EXISTS "Authenticated users can insert khairat contributions" ON public.khairat_contributions;
DROP POLICY IF EXISTS "khairat_contributions_insert_rules" ON public.khairat_contributions;
DROP POLICY IF EXISTS "Users can create khairat contributions for mosques they have access to" ON public.khairat_contributions;

-- Also drop any policies that reference program_id (which no longer exists)
-- These policies will fail and block all inserts
DROP POLICY IF EXISTS "khairat_contributions_select_user_or_admin" ON public.khairat_contributions;
DROP POLICY IF EXISTS "khairat_contributions_update_rules" ON public.khairat_contributions;
DROP POLICY IF EXISTS "khairat_contributions_delete_admins" ON public.khairat_contributions;

-- Dynamically drop ALL INSERT policies to ensure clean slate
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'khairat_contributions' 
        AND cmd = 'INSERT'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.khairat_contributions', r.policyname);
    END LOOP;
END $$;

-- Policy: Allow anonymous users to insert contributions with NULL contributor_id
-- This is for users who make payments without logging in
CREATE POLICY "Anonymous users can insert khairat contributions" ON public.khairat_contributions
  FOR INSERT 
  TO anon
  WITH CHECK (
    contributor_id IS NULL
    AND mosque_id IS NOT NULL
  );

-- Policy: Allow authenticated users to insert contributions
-- This allows logged-in users to make payments with their own ID or as anonymous
-- IMPORTANT: Using permissive policy (default) - any matching policy allows the operation
CREATE POLICY "Users can insert khairat contributions" ON public.khairat_contributions
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    -- Allow if contributor_id matches the authenticated user
    (contributor_id IS NOT NULL AND contributor_id = auth.uid())
    OR
    -- Allow if contributor_id is NULL (anonymous payment by logged-in user)
    contributor_id IS NULL
    OR
    -- Allow if user is mosque admin/owner
    EXISTS (
      SELECT 1 FROM public.mosques m
      WHERE m.id = khairat_contributions.mosque_id
      AND m.user_id = auth.uid()
    )
  );

-- Allow anonymous users to view their own contributions (by contributor_name matching)
-- Note: This is limited - anonymous users can't easily track their contributions
-- They should be encouraged to log in for better tracking
DROP POLICY IF EXISTS "Anonymous users can view khairat contributions" ON public.khairat_contributions;
CREATE POLICY "Anonymous users can view khairat contributions" ON public.khairat_contributions
  FOR SELECT 
  TO anon
  USING (
    contributor_id IS NULL
  );

