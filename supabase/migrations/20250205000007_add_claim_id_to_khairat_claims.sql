-- Migration: Add claim_id to khairat_claims for reference
-- This adds a unique, human-readable claim ID for easy reference by admins and users

-- Add claim_id column
ALTER TABLE public.khairat_claims 
ADD COLUMN IF NOT EXISTS claim_id VARCHAR(50) UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_khairat_claims_claim_id ON public.khairat_claims(claim_id);

-- Create function to generate claim ID (reuse the existing generate_random_string function if it exists)
-- If the function doesn't exist, create it
CREATE OR REPLACE FUNCTION generate_random_string(length INTEGER)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excluding confusing chars (0, O, I, 1)
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate claim ID
CREATE OR REPLACE FUNCTION generate_claim_id()
RETURNS TRIGGER AS $$
DECLARE
  new_claim_id VARCHAR(50);
  random_part TEXT;
  is_unique BOOLEAN := FALSE;
BEGIN
  -- Set the claim_id if it's not already set
  IF NEW.claim_id IS NULL THEN
    -- Generate unique claim ID: CLM-XXXXX-XXXXX (5 chars each, 10 total)
    -- Keep trying until we get a unique one
    WHILE NOT is_unique LOOP
      random_part := generate_random_string(5) || '-' || generate_random_string(5);
      new_claim_id := 'CLM-' || random_part;
      
      -- Check if this ID already exists
      SELECT NOT EXISTS (
        SELECT 1 FROM public.khairat_claims 
        WHERE claim_id = new_claim_id
      ) INTO is_unique;
    END LOOP;
    
    NEW.claim_id := new_claim_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate claim_id on insert
DROP TRIGGER IF EXISTS generate_claim_id_trigger ON public.khairat_claims;
CREATE TRIGGER generate_claim_id_trigger
  BEFORE INSERT ON public.khairat_claims
  FOR EACH ROW
  EXECUTE FUNCTION generate_claim_id();

-- Backfill existing records with claim IDs
DO $$
DECLARE
  rec RECORD;
  random_part TEXT;
  new_claim_id VARCHAR(50);
  is_unique BOOLEAN := FALSE;
BEGIN
  -- Process records
  FOR rec IN 
    SELECT id 
    FROM public.khairat_claims 
    WHERE claim_id IS NULL 
  LOOP
    -- Generate unique claim ID
    is_unique := FALSE;
    WHILE NOT is_unique LOOP
      random_part := generate_random_string(5) || '-' || generate_random_string(5);
      new_claim_id := 'CLM-' || random_part;
      
      -- Check if this ID already exists
      SELECT NOT EXISTS (
        SELECT 1 FROM public.khairat_claims 
        WHERE claim_id = new_claim_id
      ) INTO is_unique;
    END LOOP;
    
    -- Update the record
    UPDATE public.khairat_claims
    SET claim_id = new_claim_id
    WHERE id = rec.id;
  END LOOP;
END $$;

-- Add comment
COMMENT ON COLUMN public.khairat_claims.claim_id IS 'Unique claim reference ID in format CLM-XXXXX-XXXXX (random alphanumeric) for secure reference by admins and users';

