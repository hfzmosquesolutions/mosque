-- Add missing DELETE policies for khairat_members table
-- This fixes the issue where mosque admins couldn't delete records

-- Users can delete their own records (for withdrawal)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khairat_members' AND policyname = 'Users can delete own khairat records') THEN
    CREATE POLICY "Users can delete own khairat records" ON public.khairat_members
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Mosque admins can delete all records for their mosque
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khairat_members' AND policyname = 'Mosque admins can delete all khairat records') THEN
    CREATE POLICY "Mosque admins can delete all khairat records" ON public.khairat_members
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM public.mosques 
          WHERE id = khairat_members.mosque_id 
          AND user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- System admins can delete all records
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khairat_members' AND policyname = 'System admins can delete all khairat records') THEN
    CREATE POLICY "System admins can delete all khairat records" ON public.khairat_members
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      );
  END IF;
END $$;
