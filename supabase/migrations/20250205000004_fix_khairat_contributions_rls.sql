-- Fix RLS policies for khairat_contributions
-- This migration ensures all INSERT policies work correctly for both authenticated and anonymous users

-- First, ensure we have the necessary permissions
GRANT INSERT ON public.khairat_contributions TO anon;
GRANT INSERT ON public.khairat_contributions TO authenticated;

-- Drop ALL existing policies on khairat_contributions to start fresh
-- This is necessary because old policies might reference program_id which no longer exists
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies (INSERT, SELECT, UPDATE, DELETE)
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'khairat_contributions'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.khairat_contributions', r.policyname);
    END LOOP;
END $$;

-- Now create clean, working policies

-- 1. INSERT Policy for Anonymous Users
CREATE POLICY "anon_insert_khairat_contributions" ON public.khairat_contributions
  FOR INSERT 
  TO anon
  WITH CHECK (
    contributor_id IS NULL
    AND mosque_id IS NOT NULL
  );

-- 2. INSERT Policy for Authenticated Users
-- This allows authenticated users to insert with their own ID, NULL, or as mosque admin
CREATE POLICY "authenticated_insert_khairat_contributions" ON public.khairat_contributions
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    -- Case 1: contributor_id matches the authenticated user
    (contributor_id IS NOT NULL AND contributor_id = auth.uid())
    OR
    -- Case 2: contributor_id is NULL (anonymous payment by logged-in user)
    contributor_id IS NULL
    OR
    -- Case 3: user is mosque admin/owner
    EXISTS (
      SELECT 1 FROM public.mosques m
      WHERE m.id = khairat_contributions.mosque_id
      AND m.user_id = auth.uid()
    )
  );

-- 3. SELECT Policy for Anonymous Users
CREATE POLICY "anon_select_khairat_contributions" ON public.khairat_contributions
  FOR SELECT 
  TO anon
  USING (
    contributor_id IS NULL
  );

-- 4. SELECT Policy for Authenticated Users
CREATE POLICY "authenticated_select_khairat_contributions" ON public.khairat_contributions
  FOR SELECT 
  TO authenticated
  USING (
    -- Users can see their own contributions
    contributor_id = auth.uid()
    OR
    -- Users can see contributions with NULL contributor_id (anonymous)
    contributor_id IS NULL
    OR
    -- Mosque admins can see all contributions for their mosque
    EXISTS (
      SELECT 1 FROM public.mosques m
      WHERE m.id = khairat_contributions.mosque_id
      AND m.user_id = auth.uid()
    )
  );

-- 5. UPDATE Policy for Authenticated Users
CREATE POLICY "authenticated_update_khairat_contributions" ON public.khairat_contributions
  FOR UPDATE 
  TO authenticated
  USING (
    -- Users can update their own contributions
    contributor_id = auth.uid()
    OR
    -- Mosque admins can update contributions for their mosque
    EXISTS (
      SELECT 1 FROM public.mosques m
      WHERE m.id = khairat_contributions.mosque_id
      AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Same conditions for WITH CHECK
    contributor_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.mosques m
      WHERE m.id = khairat_contributions.mosque_id
      AND m.user_id = auth.uid()
    )
  );

-- 6. DELETE Policy for Authenticated Users (only mosque admins)
CREATE POLICY "authenticated_delete_khairat_contributions" ON public.khairat_contributions
  FOR DELETE 
  TO authenticated
  USING (
    -- Only mosque admins can delete
    EXISTS (
      SELECT 1 FROM public.mosques m
      WHERE m.id = khairat_contributions.mosque_id
      AND m.user_id = auth.uid()
    )
  );

