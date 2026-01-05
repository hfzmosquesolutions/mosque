-- Migration: Allow anonymous users to submit khairat claims
-- Similar to khairat_contributions, users can submit claims without logging in
-- They must verify membership by IC number first, which provides khairat_member_id

-- Grant INSERT permission to anon role
GRANT INSERT ON public.khairat_claims TO anon;

-- Drop existing INSERT policies that might conflict
DROP POLICY IF EXISTS "Anonymous users can insert khairat claims" ON public.khairat_claims;
DROP POLICY IF EXISTS "Users can create their own claims" ON public.khairat_claims;

-- Dynamically drop ALL INSERT policies to ensure clean slate
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'khairat_claims' 
        AND cmd = 'INSERT'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.khairat_claims', r.policyname);
    END LOOP;
END $$;

-- Policy: Allow anonymous users to insert claims with NULL claimant_id
-- khairat_member_id is required (verified by IC number)
CREATE POLICY "Anonymous users can insert khairat claims" ON public.khairat_claims
  FOR INSERT 
  TO anon
  WITH CHECK (
    claimant_id IS NULL
    AND khairat_member_id IS NOT NULL
    AND mosque_id IS NOT NULL
  );

-- Policy: Allow authenticated users to insert claims
-- They can submit with their own ID or as anonymous (NULL claimant_id)
CREATE POLICY "Users can insert khairat claims" ON public.khairat_claims
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    -- Allow if claimant_id matches the authenticated user
    (claimant_id IS NOT NULL AND claimant_id = auth.uid())
    OR
    -- Allow if claimant_id is NULL (anonymous claim by logged-in user)
    claimant_id IS NULL
    OR
    -- Allow if user is mosque admin/owner
    EXISTS (
      SELECT 1 FROM public.mosques m
      WHERE m.id = khairat_claims.mosque_id
      AND m.user_id = auth.uid()
    )
  );

-- Allow anonymous users to view claims (limited - they can't easily track)
-- Note: Anonymous users should be encouraged to log in for better tracking
DROP POLICY IF EXISTS "Anonymous users can view khairat claims" ON public.khairat_claims;
CREATE POLICY "Anonymous users can view khairat claims" ON public.khairat_claims
  FOR SELECT 
  TO anon
  USING (
    claimant_id IS NULL
  );

