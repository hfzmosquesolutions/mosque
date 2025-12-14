-- Migration: Make claimant_id nullable in khairat_claims
-- This allows anonymous claim submissions (users not logged in)
-- The check constraint ensures either khairat_member_id or claimant_id is provided

-- Make claimant_id nullable
ALTER TABLE public.khairat_claims 
ALTER COLUMN claimant_id DROP NOT NULL;

-- Update the foreign key constraint to allow NULL values
-- First, drop the existing foreign key constraint
ALTER TABLE public.khairat_claims
DROP CONSTRAINT IF EXISTS khairat_claims_claimant_id_fkey;

-- Recreate the foreign key constraint without NOT NULL requirement
ALTER TABLE public.khairat_claims
ADD CONSTRAINT khairat_claims_claimant_id_fkey 
FOREIGN KEY (claimant_id) 
REFERENCES public.user_profiles(id) 
ON DELETE CASCADE;

-- The check constraint already exists from previous migration:
-- khairat_claims_member_or_claimant_check ensures either khairat_member_id or claimant_id is provided

