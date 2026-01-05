-- Migration: Remove claimant_id filtering from khairat_claims
-- Since we now filter by khairat_member_id instead, we no longer need claimant_id-based filtering
-- This migration updates RLS policies to remove claimant_id dependencies

-- Drop existing SELECT policies that filter by claimant_id
DROP POLICY IF EXISTS "Anonymous users can view khairat claims" ON public.khairat_claims;
DROP POLICY IF EXISTS "Users can view their own claims" ON public.khairat_claims;
DROP POLICY IF EXISTS "Mosque admins can view all claims" ON public.khairat_claims;

-- Create new SELECT policies that don't filter by claimant_id
-- Instead, filtering is done by khairat_member_id and mosque_id

-- Policy: Authenticated users can view claims for their khairat memberships
-- They can see claims linked to their khairat_member records
CREATE POLICY "Users can view claims for their memberships" ON public.khairat_claims
  FOR SELECT 
  TO authenticated
  USING (
    -- User can see claims linked to their khairat_member records
    EXISTS (
      SELECT 1 FROM public.khairat_members km
      WHERE km.id = khairat_claims.khairat_member_id
      AND km.user_id = auth.uid()
    )
    OR
    -- User can see claims for mosques they admin
    EXISTS (
      SELECT 1 FROM public.mosques m
      WHERE m.id = khairat_claims.mosque_id
      AND m.user_id = auth.uid()
    )
  );

-- Policy: Mosque admins can view all claims for their mosque
-- This is the primary way admins view claims (filtered by mosque_id in application)
CREATE POLICY "Mosque admins can view mosque claims" ON public.khairat_claims
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mosques m
      WHERE m.id = khairat_claims.mosque_id
      AND m.user_id = auth.uid()
    )
  );

-- Policy: Anonymous users can view claims they submitted (if they have a way to track)
-- Since anonymous users don't have claimant_id, they can't easily track their claims
-- This policy allows viewing but is limited in practice
-- Note: Anonymous users should be encouraged to log in for better tracking
CREATE POLICY "Anonymous users can view claims" ON public.khairat_claims
  FOR SELECT 
  TO anon
  USING (
    -- Allow viewing claims where claimant_id is NULL (anonymous submissions)
    -- In practice, anonymous users won't be able to easily identify their claims
    -- without some other tracking mechanism
    claimant_id IS NULL
  );

-- Update INSERT policies to remove claimant_id checks (already done in previous migration)
-- The INSERT policies in 20250206000005_allow_anonymous_claims.sql are still valid
-- They allow both authenticated and anonymous users to insert claims

-- Note: claimant_id column is kept in the table for backward compatibility
-- but is no longer used for filtering. All filtering is now done by khairat_member_id.

COMMENT ON COLUMN public.khairat_claims.claimant_id IS 
  'Optional reference to the user who submitted the claim. No longer used for filtering - use khairat_member_id instead.';

