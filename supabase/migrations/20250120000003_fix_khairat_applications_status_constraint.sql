-- Fix khairat_applications status constraint to include 'under_review'
-- This migration updates the existing constraint to match the kariah applications pattern

-- Drop the existing constraint
ALTER TABLE public.khairat_applications 
DROP CONSTRAINT IF EXISTS khairat_applications_status_check;

-- Add the updated constraint with 'under_review' status
ALTER TABLE public.khairat_applications 
ADD CONSTRAINT khairat_applications_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'under_review', 'withdrawn'));
