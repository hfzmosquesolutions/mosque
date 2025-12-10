-- Migration: Add khairat_member_id to khairat_claims table
-- This links claims to khairat_members records instead of just user_profiles
-- This allows claims to be associated with the membership record, supporting both
-- account-based and direct-registered members

-- Add khairat_member_id column (nullable for backward compatibility)
ALTER TABLE public.khairat_claims 
ADD COLUMN IF NOT EXISTS khairat_member_id uuid;

-- Add foreign key constraint
ALTER TABLE public.khairat_claims
ADD CONSTRAINT khairat_claims_khairat_member_id_fkey 
FOREIGN KEY (khairat_member_id) 
REFERENCES public.khairat_members(id) 
ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_khairat_claims_khairat_member_id 
ON public.khairat_claims(khairat_member_id);

-- Make claimant_id nullable (for backward compatibility, but new claims should use khairat_member_id)
-- Note: We keep claimant_id for now to maintain backward compatibility with existing claims
-- ALTER TABLE public.khairat_claims ALTER COLUMN claimant_id DROP NOT NULL;

-- Add check constraint to ensure either khairat_member_id or claimant_id is provided
ALTER TABLE public.khairat_claims
DROP CONSTRAINT IF EXISTS khairat_claims_member_or_claimant_check;

ALTER TABLE public.khairat_claims
ADD CONSTRAINT khairat_claims_member_or_claimant_check 
CHECK (
  (khairat_member_id IS NOT NULL) OR 
  (claimant_id IS NOT NULL)
);

-- Update RLS policies to support khairat_member_id
-- Users can view claims for their khairat memberships
DROP POLICY IF EXISTS "Users can view their own claims" ON public.khairat_claims;
CREATE POLICY "Users can view their own claims" ON public.khairat_claims
  FOR SELECT USING (
    -- Check via khairat_member_id
    EXISTS (
      SELECT 1 FROM public.khairat_members km
      WHERE km.id = khairat_claims.khairat_member_id
        AND km.user_id = auth.uid()
    )
    OR
    -- Fallback to claimant_id for backward compatibility
    auth.uid() = claimant_id
  );

-- Users can create claims for their khairat memberships
DROP POLICY IF EXISTS "Users can create their own claims" ON public.khairat_claims;
CREATE POLICY "Users can create their own claims" ON public.khairat_claims
  FOR INSERT WITH CHECK (
    -- Check via khairat_member_id
    EXISTS (
      SELECT 1 FROM public.khairat_members km
      WHERE km.id = khairat_claims.khairat_member_id
        AND km.user_id = auth.uid()
    )
    OR
    -- Fallback to claimant_id for backward compatibility
    auth.uid() = claimant_id
  );

-- Users can update their own pending claims
DROP POLICY IF EXISTS "Users can update their own pending claims" ON public.khairat_claims;
CREATE POLICY "Users can update their own pending claims" ON public.khairat_claims
  FOR UPDATE USING (
    (
      -- Check via khairat_member_id
      EXISTS (
        SELECT 1 FROM public.khairat_members km
        WHERE km.id = khairat_claims.khairat_member_id
          AND km.user_id = auth.uid()
      )
      OR
      -- Fallback to claimant_id for backward compatibility
      auth.uid() = claimant_id
    )
    AND 
    status IN ('pending', 'under_review')
  );

-- Update khairat_claim_documents RLS to support khairat_member_id
DROP POLICY IF EXISTS "Users can view their own khairat claim documents" ON public.khairat_claim_documents;
CREATE POLICY "Users can view their own khairat claim documents" ON public.khairat_claim_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      WHERE kc.id = khairat_claim_documents.claim_id 
        AND (
          -- Check via khairat_member_id
          EXISTS (
            SELECT 1 FROM public.khairat_members km
            WHERE km.id = kc.khairat_member_id
              AND km.user_id = auth.uid()
          )
          OR
          -- Fallback to claimant_id
          kc.claimant_id = auth.uid()
        )
    )
  );

-- Update khairat_claim_documents upload policy
DROP POLICY IF EXISTS "Users can upload documents for their khairat claims" ON public.khairat_claim_documents;
CREATE POLICY "Users can upload documents for their khairat claims" ON public.khairat_claim_documents
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      WHERE kc.id = khairat_claim_documents.claim_id 
        AND (
          -- Check via khairat_member_id
          EXISTS (
            SELECT 1 FROM public.khairat_members km
            WHERE km.id = kc.khairat_member_id
              AND km.user_id = auth.uid()
          )
          OR
          -- Fallback to claimant_id
          kc.claimant_id = auth.uid()
        )
        AND kc.status IN ('pending', 'under_review')
    )
  );

-- Note: khairat_claim_history table was removed in migration 20250110000000_remove_claim_history.sql
-- No RLS policy updates needed for history table

-- Add comment
COMMENT ON COLUMN public.khairat_claims.khairat_member_id IS 'Reference to khairat_members table. Preferred over claimant_id for linking claims to membership records.';

