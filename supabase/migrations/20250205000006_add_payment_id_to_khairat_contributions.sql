-- Migration: Add payment_id to khairat_contributions for reference
-- This adds a unique, human-readable payment ID for easy reference by admins and users

-- Add payment_id column
ALTER TABLE public.khairat_contributions 
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(50) UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_khairat_contributions_payment_id ON public.khairat_contributions(payment_id);

-- Create function to generate random alphanumeric string
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

-- Create function to generate payment ID
CREATE OR REPLACE FUNCTION generate_payment_id()
RETURNS TRIGGER AS $$
DECLARE
  new_payment_id VARCHAR(50);
  random_part TEXT;
  is_unique BOOLEAN := FALSE;
BEGIN
  -- Set the payment_id if it's not already set
  IF NEW.payment_id IS NULL THEN
    -- Generate unique payment ID: PAY-XXXXX-XXXXX (5 chars each, 10 total)
    -- Keep trying until we get a unique one
    WHILE NOT is_unique LOOP
      random_part := generate_random_string(5) || '-' || generate_random_string(5);
      new_payment_id := 'PAY-' || random_part;
      
      -- Check if this ID already exists
      SELECT NOT EXISTS (
        SELECT 1 FROM public.khairat_contributions 
        WHERE payment_id = new_payment_id
      ) INTO is_unique;
    END LOOP;
    
    NEW.payment_id := new_payment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate payment_id on insert
DROP TRIGGER IF EXISTS generate_payment_id_trigger ON public.khairat_contributions;
CREATE TRIGGER generate_payment_id_trigger
  BEFORE INSERT ON public.khairat_contributions
  FOR EACH ROW
  EXECUTE FUNCTION generate_payment_id();

-- Backfill existing records with payment IDs
DO $$
DECLARE
  rec RECORD;
  random_part TEXT;
  new_payment_id VARCHAR(50);
  is_unique BOOLEAN := FALSE;
BEGIN
  -- Process records
  FOR rec IN 
    SELECT id 
    FROM public.khairat_contributions 
    WHERE payment_id IS NULL 
  LOOP
    -- Generate unique payment ID
    is_unique := FALSE;
    WHILE NOT is_unique LOOP
      random_part := generate_random_string(5) || '-' || generate_random_string(5);
      new_payment_id := 'PAY-' || random_part;
      
      -- Check if this ID already exists
      SELECT NOT EXISTS (
        SELECT 1 FROM public.khairat_contributions 
        WHERE payment_id = new_payment_id
      ) INTO is_unique;
    END LOOP;
    
    -- Update the record
    UPDATE public.khairat_contributions
    SET payment_id = new_payment_id
    WHERE id = rec.id;
  END LOOP;
END $$;

-- Add comment
COMMENT ON COLUMN public.khairat_contributions.payment_id IS 'Unique payment reference ID in format PAY-XXXXX-XXXXX (random alphanumeric) for secure reference by admins and users';

