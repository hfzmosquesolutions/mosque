-- Remove prayer_times column from mosques table
-- This migration removes the prayer times functionality from the system

-- Drop the prayer_times column from mosques table
ALTER TABLE public.mosques DROP COLUMN IF EXISTS prayer_times;

-- Add comment to document the change
COMMENT ON TABLE public.mosques IS 'Mosque information table - prayer times functionality removed';
