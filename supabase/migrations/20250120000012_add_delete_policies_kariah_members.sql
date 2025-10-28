-- Add RLS policies for DELETE operations on kariah_members

-- Users can delete their own records (e.g., to withdraw an application)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kariah_members' AND policyname = 'Users can delete own kariah records') THEN
    CREATE POLICY "Users can delete own kariah records" ON public.kariah_members
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Mosque admins can delete records for their mosque
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kariah_members' AND policyname = 'Mosque admins can delete kariah records') THEN
    CREATE POLICY "Mosque admins can delete kariah records" ON public.kariah_members
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM public.mosques
          WHERE id = kariah_members.mosque_id
          AND user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- System admins can delete all records
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kariah_members' AND policyname = 'System admins can delete all kariah records') THEN
    CREATE POLICY "System admins can delete all kariah records" ON public.kariah_members
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE id = auth.uid()
          AND role = 'admin'
        )
      );
  END IF;
END $$;
