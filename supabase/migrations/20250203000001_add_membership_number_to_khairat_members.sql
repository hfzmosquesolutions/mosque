-- Migration: Add membership_number to khairat_members table
-- This adds a unique member ID that is auto-generated when a member becomes active

-- Add membership_number column
ALTER TABLE public.khairat_members 
ADD COLUMN IF NOT EXISTS membership_number varchar(50);

-- Create index for membership_number
CREATE INDEX IF NOT EXISTS idx_khairat_members_membership_number 
ON public.khairat_members(membership_number);

-- Create unique constraint on (mosque_id, membership_number) to ensure uniqueness per mosque
CREATE UNIQUE INDEX IF NOT EXISTS idx_khairat_members_mosque_membership_number_unique 
ON public.khairat_members(mosque_id, membership_number) 
WHERE membership_number IS NOT NULL;

-- Function to generate unique membership number for a mosque
CREATE OR REPLACE FUNCTION generate_khairat_membership_number(p_mosque_id uuid)
RETURNS varchar(50) AS $$
DECLARE
  v_prefix varchar(10);
  v_next_number integer;
  v_membership_number varchar(50);
  v_mosque_id_text text;
BEGIN
  -- Use first 6 characters of mosque UUID (uppercase) as unique prefix
  -- This ensures each mosque has a unique prefix
  v_mosque_id_text := REPLACE(p_mosque_id::text, '-', '');
  v_prefix := UPPER(SUBSTRING(v_mosque_id_text FROM 1 FOR 6));
  
  -- Get the next sequential number for this mosque
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(membership_number FROM LENGTH(v_prefix) + 2) AS INTEGER
    )
  ), 0) + 1
  INTO v_next_number
  FROM public.khairat_members
  WHERE mosque_id = p_mosque_id
    AND membership_number IS NOT NULL
    AND membership_number LIKE v_prefix || '-%';
  
  -- Format: PREFIX-0001, PREFIX-0002, etc.
  -- Example: A1B2C3-0001, A1B2C3-0002
  v_membership_number := v_prefix || '-' || LPAD(v_next_number::text, 4, '0');
  
  RETURN v_membership_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-generate membership number when status becomes 'active'
CREATE OR REPLACE FUNCTION auto_generate_khairat_membership_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate membership number when status changes to 'active' and membership_number is NULL
  IF NEW.status = 'active' AND (NEW.membership_number IS NULL OR NEW.membership_number = '') THEN
    NEW.membership_number := generate_khairat_membership_number(NEW.mosque_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_khairat_membership_number ON public.khairat_members;
CREATE TRIGGER trigger_auto_generate_khairat_membership_number
  BEFORE INSERT OR UPDATE ON public.khairat_members
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_khairat_membership_number();

-- Backfill existing active members with membership numbers
DO $$
DECLARE
  member_record RECORD;
  new_membership_number varchar(50);
BEGIN
  FOR member_record IN 
    SELECT id, mosque_id 
    FROM public.khairat_members 
    WHERE status = 'active' 
      AND (membership_number IS NULL OR membership_number = '')
  LOOP
    new_membership_number := generate_khairat_membership_number(member_record.mosque_id);
    
    UPDATE public.khairat_members
    SET membership_number = new_membership_number
    WHERE id = member_record.id;
  END LOOP;
END $$;

