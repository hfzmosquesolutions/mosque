-- Migration: Add original_registration_date to khairat_members
-- This allows admins to record the historical registration date for legacy members
-- while preserving created_at as an immutable audit trail

-- Add the original_registration_date field
ALTER TABLE public.khairat_members 
ADD COLUMN IF NOT EXISTS original_registration_date DATE;

-- Add comment to explain the field
COMMENT ON COLUMN public.khairat_members.original_registration_date IS 
'Historical registration date for legacy members. When a member was originally registered with the mosque (before system implementation). This is separate from created_at which tracks when the record was created in the system.';

-- Create index for better query performance when filtering by original registration date
CREATE INDEX IF NOT EXISTS idx_khairat_members_original_registration_date 
ON public.khairat_members(original_registration_date);
