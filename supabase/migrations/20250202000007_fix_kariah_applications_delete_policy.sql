-- Fix kariah applications DELETE policy to allow users to delete their own applications
-- This addresses the issue where users cannot delete their rejected applications

-- Add policy for users to delete their own applications
CREATE POLICY "Users can delete their own applications" ON kariah_applications
    FOR DELETE
    USING (auth.uid() = user_id);

-- Grant DELETE permission to authenticated users (if not already granted)
GRANT DELETE ON kariah_applications TO authenticated;