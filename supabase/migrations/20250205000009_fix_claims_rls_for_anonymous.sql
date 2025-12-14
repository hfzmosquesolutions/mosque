-- Migration: Fix RLS policies for khairat_claims to support anonymous claims
-- This ensures mosque admins can see all claims including those with NULL claimant_id

-- The existing "Mosque admins can view all claims" policy should already work
-- because it only checks mosque_id, not claimant_id. However, let's ensure
-- it's properly set up and doesn't have any issues.

-- Drop and recreate the policy to ensure it works correctly
DROP POLICY IF EXISTS "Mosque admins can view all claims" ON public.khairat_claims;

CREATE POLICY "Mosque admins can view all claims" ON public.khairat_claims
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mosques m
      WHERE m.id = khairat_claims.mosque_id 
        AND m.user_id = auth.uid()
    )
  );

-- Also ensure the update policy works for anonymous claims
DROP POLICY IF EXISTS "Mosque admins can update claims" ON public.khairat_claims;

CREATE POLICY "Mosque admins can update claims" ON public.khairat_claims
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.mosques m
      WHERE m.id = khairat_claims.mosque_id 
        AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mosques m
      WHERE m.id = khairat_claims.mosque_id 
        AND m.user_id = auth.uid()
    )
  );

-- Note: The API route uses getSupabaseAdmin() which bypasses RLS,
-- so these policies are mainly for direct database access.
-- However, ensuring they're correct is good practice.

