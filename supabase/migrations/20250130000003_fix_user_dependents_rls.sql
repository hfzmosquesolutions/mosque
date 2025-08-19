-- Fix RLS policies for user_dependents table
-- The issue is that auth.uid() doesn't directly match user_id in user_dependents
-- We need to join with user_profiles to get the correct user_id

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own dependents" ON public.user_dependents;
DROP POLICY IF EXISTS "Users can insert their own dependents" ON public.user_dependents;
DROP POLICY IF EXISTS "Users can update their own dependents" ON public.user_dependents;
DROP POLICY IF EXISTS "Users can delete their own dependents" ON public.user_dependents;

-- Create new policies that properly reference user_profiles
CREATE POLICY "Users can view their own dependents" ON public.user_dependents
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own dependents" ON public.user_dependents
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own dependents" ON public.user_dependents
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own dependents" ON public.user_dependents
  FOR DELETE USING (
    user_id IN (
      SELECT id FROM public.user_profiles WHERE id = auth.uid()
    )
  );