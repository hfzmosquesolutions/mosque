-- Migration: Remove unused columns from khairat_claims table
-- These columns are not used in the current implementation

-- Remove the supporting_documents column (redundant with khairat_claim_documents table)
ALTER TABLE public.khairat_claims DROP COLUMN IF EXISTS supporting_documents;

-- Remove unused disbursement-related columns
ALTER TABLE public.khairat_claims DROP COLUMN IF EXISTS disbursement_method;
ALTER TABLE public.khairat_claims DROP COLUMN IF EXISTS disbursement_reference;
ALTER TABLE public.khairat_claims DROP COLUMN IF EXISTS disbursed_at;

-- Remove unused reason_category column
ALTER TABLE public.khairat_claims DROP COLUMN IF EXISTS reason_category;

-- Also remove from kariah_applications table if it exists (for consistency)
ALTER TABLE public.kariah_applications DROP COLUMN IF EXISTS supporting_documents;

-- Add comment to document the change
COMMENT ON TABLE public.khairat_claims IS 'Khairat claims table - documents are now stored in khairat_claim_documents table';
