-- Allow users to query khairat_members by IC number for verification
-- This is needed for payment verification, but we need to be careful about security
-- We'll use a more restrictive approach: only allow querying records with user_id = NULL
-- and only return limited information (status, membership_number, not personal details)

-- Note: The actual data filtering will be done in the API layer to limit exposure
-- This policy only allows the query to happen, but we'll limit what's returned

-- Grant SELECT permission to authenticated role (if not already granted)
GRANT SELECT ON public.khairat_members TO authenticated;

-- Keep the original policy for own records
-- Users can view their own records (only if user_id matches)
DROP POLICY IF EXISTS "Users can view own khairat records" ON public.khairat_members;
CREATE POLICY "Users can view own khairat records" ON public.khairat_members
  FOR SELECT USING (
    user_id IS NOT NULL AND auth.uid() = user_id
  );

-- Add a separate, more restrictive policy for IC number verification
-- SECURITY: Only allow querying records with user_id = NULL (anonymous registrations)
-- This prevents enumeration attacks on registered users' data
-- Authenticated users can only see their own records (via the "own records" policy)
DROP POLICY IF EXISTS "Users can verify membership by IC number" ON public.khairat_members;
CREATE POLICY "Users can verify membership by IC number" ON public.khairat_members
  FOR SELECT 
  TO authenticated, anon
  USING (
    -- Only allow querying anonymous registrations (user_id = NULL)
    -- This prevents attackers from enumerating IC numbers of registered users
    -- Registered users should use their account to access their records
    user_id IS NULL
    AND ic_passport_number IS NOT NULL
  );

-- Policy: Allow anonymous users to view records by IC number (for verification)
-- Update existing policy to be more explicit
DROP POLICY IF EXISTS "Anonymous users can view khairat records" ON public.khairat_members;
CREATE POLICY "Anonymous users can view khairat records" ON public.khairat_members
  FOR SELECT 
  TO anon
  USING (
    user_id IS NULL
    AND ic_passport_number IS NOT NULL
  );

