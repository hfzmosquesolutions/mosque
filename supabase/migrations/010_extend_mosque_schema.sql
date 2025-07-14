-- Extend mosque table schema to include missing fields
-- This migration adds the missing columns that are referenced in the application

-- Add missing columns to mosques table
ALTER TABLE public.mosques 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS postcode TEXT,
ADD COLUMN IF NOT EXISTS imam TEXT,
ADD COLUMN IF NOT EXISTS chairman TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
ADD COLUMN IF NOT EXISTS established_date DATE,
ADD COLUMN IF NOT EXISTS services TEXT[],
ADD COLUMN IF NOT EXISTS operating_hours JSONB,
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS bank_account TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mosques_city ON public.mosques(city);
CREATE INDEX IF NOT EXISTS idx_mosques_state ON public.mosques(state);
CREATE INDEX IF NOT EXISTS idx_mosques_name ON public.mosques(name);
CREATE INDEX IF NOT EXISTS idx_mosques_status ON public.mosques(status);

-- Update RLS policies to ensure they work with the extended schema
-- (The existing policies in 009_mosque_rls_policies.sql should continue to work)

-- Add a comment to document the schema extension
COMMENT ON TABLE public.mosques IS 'Extended mosque table with additional fields for public profiles and enhanced functionality';
COMMENT ON COLUMN public.mosques.city IS 'City where the mosque is located';
COMMENT ON COLUMN public.mosques.state IS 'State/province where the mosque is located';
COMMENT ON COLUMN public.mosques.postcode IS 'Postal/ZIP code of the mosque';
COMMENT ON COLUMN public.mosques.imam IS 'Name of the mosque imam';
COMMENT ON COLUMN public.mosques.chairman IS 'Name of the mosque chairman';
COMMENT ON COLUMN public.mosques.status IS 'Status of the mosque (active, inactive, pending)';
COMMENT ON COLUMN public.mosques.established_date IS 'Date when the mosque was established';
COMMENT ON COLUMN public.mosques.services IS 'Array of services offered by the mosque';
COMMENT ON COLUMN public.mosques.operating_hours IS 'JSON object containing operating hours information';
COMMENT ON COLUMN public.mosques.registration_number IS 'Official registration number (private field)';
COMMENT ON COLUMN public.mosques.bank_account IS 'Bank account information (private field)';