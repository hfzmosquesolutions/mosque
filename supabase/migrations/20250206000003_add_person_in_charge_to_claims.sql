-- Migration: Add person in charge fields to khairat_claims
-- This allows storing contact information for someone applying on behalf of a member

-- Add person in charge columns to khairat_claims table
ALTER TABLE public.khairat_claims 
ADD COLUMN IF NOT EXISTS person_in_charge_name character varying(255),
ADD COLUMN IF NOT EXISTS person_in_charge_phone character varying(50),
ADD COLUMN IF NOT EXISTS person_in_charge_relationship character varying(100);

-- Add comments for documentation
COMMENT ON COLUMN public.khairat_claims.person_in_charge_name IS 'Name of the person applying on behalf of the member (optional)';
COMMENT ON COLUMN public.khairat_claims.person_in_charge_phone IS 'Phone number of the person applying on behalf of the member (optional)';
COMMENT ON COLUMN public.khairat_claims.person_in_charge_relationship IS 'Relationship of the person applying on behalf of the member (e.g., son, daughter, spouse, brother, etc.) (optional)';

