-- Fix kariah applications UPDATE policy to allow users to withdraw their own applications
-- The current policy only allows updates when status = 'pending', but withdrawal changes status to 'withdrawn'

-- First, add 'withdrawn' to the status CHECK constraint
ALTER TABLE kariah_applications DROP CONSTRAINT IF EXISTS kariah_applications_status_check;
ALTER TABLE kariah_applications ADD CONSTRAINT kariah_applications_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected', 'under_review', 'withdrawn'));

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can update own pending applications" ON kariah_applications;

-- Drop any existing policy with the same name to avoid conflicts
DROP POLICY IF EXISTS "Users can update their own applications" ON kariah_applications;

-- Create a new policy that allows users to update their own applications
-- This includes withdrawing (changing status to 'withdrawn') and other updates
CREATE POLICY "Users can update their own applications" ON kariah_applications
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Ensure users have UPDATE permission
GRANT UPDATE ON kariah_applications TO authenticated;
