-- Migration: Add institution_type field to mosques table
-- This allows distinguishing between mosque and surau

-- Add institution_type column with default value 'mosque' for backward compatibility
ALTER TABLE public.mosques 
ADD COLUMN IF NOT EXISTS institution_type text DEFAULT 'mosque' 
CHECK (institution_type IN ('mosque', 'surau'));

-- Create index for filtering by institution type
CREATE INDEX IF NOT EXISTS idx_mosques_institution_type ON public.mosques(institution_type);

-- Update existing records to have 'mosque' as default (if any are NULL)
UPDATE public.mosques 
SET institution_type = 'mosque' 
WHERE institution_type IS NULL;

-- Add comment to document the field
COMMENT ON COLUMN public.mosques.institution_type IS 
  'Type of institution: mosque or surau. Defaults to mosque.';

