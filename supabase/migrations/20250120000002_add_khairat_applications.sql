-- Migration: Add Khairat Applications System
-- This migration creates the khairat application system similar to kariah applications
-- where users can apply to join khairat programs and admins can manage applications

-- Create khairat_applications table (if not exists)
CREATE TABLE IF NOT EXISTS public.khairat_applications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  mosque_id uuid NOT NULL,
  program_id uuid,
  ic_passport_number varchar(20),
  application_reason text,
  status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review', 'withdrawn')),
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT khairat_applications_pkey PRIMARY KEY (id),
  CONSTRAINT khairat_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  CONSTRAINT khairat_applications_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES public.mosques(id) ON DELETE CASCADE,
  CONSTRAINT khairat_applications_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.khairat_programs(id) ON DELETE SET NULL,
  CONSTRAINT khairat_applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

-- Create khairat_memberships table for approved applications (if not exists)
CREATE TABLE IF NOT EXISTS public.khairat_memberships (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  mosque_id uuid NOT NULL,
  program_id uuid,
  status varchar(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  joined_date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT khairat_memberships_pkey PRIMARY KEY (id),
  CONSTRAINT khairat_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  CONSTRAINT khairat_memberships_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES public.mosques(id) ON DELETE CASCADE,
  CONSTRAINT khairat_memberships_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.khairat_programs(id) ON DELETE SET NULL
);

-- Add indexes for better performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_khairat_applications_user_id ON public.khairat_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_khairat_applications_mosque_id ON public.khairat_applications(mosque_id);
CREATE INDEX IF NOT EXISTS idx_khairat_applications_status ON public.khairat_applications(status);
CREATE INDEX IF NOT EXISTS idx_khairat_applications_created_at ON public.khairat_applications(created_at);

CREATE INDEX IF NOT EXISTS idx_khairat_memberships_user_id ON public.khairat_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_khairat_memberships_mosque_id ON public.khairat_memberships(mosque_id);
CREATE INDEX IF NOT EXISTS idx_khairat_memberships_status ON public.khairat_memberships(status);

-- Add RLS policies for khairat_applications
ALTER TABLE public.khairat_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khairat_applications' AND policyname = 'Users can view own khairat applications') THEN
    CREATE POLICY "Users can view own khairat applications" ON public.khairat_applications
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can insert their own applications
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khairat_applications' AND policyname = 'Users can insert own khairat applications') THEN
    CREATE POLICY "Users can insert own khairat applications" ON public.khairat_applications
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Users can update their own applications (for withdrawal)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khairat_applications' AND policyname = 'Users can update own khairat applications') THEN
    CREATE POLICY "Users can update own khairat applications" ON public.khairat_applications
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can delete their own applications (for reapplication)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khairat_applications' AND policyname = 'Users can delete own khairat applications') THEN
    CREATE POLICY "Users can delete own khairat applications" ON public.khairat_applications
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Mosque admins can view applications for their mosque
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khairat_applications' AND policyname = 'Mosque admins can view khairat applications') THEN
    CREATE POLICY "Mosque admins can view khairat applications" ON public.khairat_applications
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.mosques 
          WHERE id = mosque_id 
          AND user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Mosque admins can update applications for their mosque
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khairat_applications' AND policyname = 'Mosque admins can update khairat applications') THEN
    CREATE POLICY "Mosque admins can update khairat applications" ON public.khairat_applications
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.mosques 
          WHERE id = mosque_id 
          AND user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- System admins can view all applications
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khairat_applications' AND policyname = 'Admins can view all khairat applications') THEN
    CREATE POLICY "Admins can view all khairat applications" ON public.khairat_applications
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      );
  END IF;
END $$;

-- System admins can update all applications
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khairat_applications' AND policyname = 'Admins can update all khairat applications') THEN
    CREATE POLICY "Admins can update all khairat applications" ON public.khairat_applications
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      );
  END IF;
END $$;

-- Add RLS policies for khairat_memberships
ALTER TABLE public.khairat_memberships ENABLE ROW LEVEL SECURITY;

-- Users can view their own memberships
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khairat_memberships' AND policyname = 'Users can view own khairat memberships') THEN
    CREATE POLICY "Users can view own khairat memberships" ON public.khairat_memberships
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Mosque admins can view memberships for their mosque
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khairat_memberships' AND policyname = 'Mosque admins can view khairat memberships') THEN
    CREATE POLICY "Mosque admins can view khairat memberships" ON public.khairat_memberships
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.mosques 
          WHERE id = mosque_id 
          AND user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Mosque admins can insert memberships for their mosque
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khairat_memberships' AND policyname = 'Mosque admins can insert khairat memberships') THEN
    CREATE POLICY "Mosque admins can insert khairat memberships" ON public.khairat_memberships
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.mosques 
          WHERE id = mosque_id 
          AND user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Mosque admins can update memberships for their mosque
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khairat_memberships' AND policyname = 'Mosque admins can update khairat memberships') THEN
    CREATE POLICY "Mosque admins can update khairat memberships" ON public.khairat_memberships
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.mosques 
          WHERE id = mosque_id 
          AND user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- System admins can view all memberships
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khairat_memberships' AND policyname = 'Admins can view all khairat memberships') THEN
    CREATE POLICY "Admins can view all khairat memberships" ON public.khairat_memberships
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      );
  END IF;
END $$;

-- System admins can insert all memberships
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khairat_memberships' AND policyname = 'Admins can insert khairat memberships') THEN
    CREATE POLICY "Admins can insert khairat memberships" ON public.khairat_memberships
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_profiles 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      );
  END IF;
END $$;

-- System admins can update all memberships
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khairat_memberships' AND policyname = 'Admins can update khairat memberships') THEN
    CREATE POLICY "Admins can update khairat memberships" ON public.khairat_memberships
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      );
  END IF;
END $$;

-- Add khairat registration settings to mosque settings
-- This will be handled in the mosque settings update, but we can add a comment here
-- The settings will be stored in the mosques.settings JSONB column under 'khairat_registration'

-- Create function to notify admins of new khairat applications
CREATE OR REPLACE FUNCTION notify_admin_new_khairat_application()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert notification for mosque admin
    INSERT INTO public.notifications (
        user_id,
        mosque_id,
        title,
        message,
        type,
        metadata,
        created_at
    )
    SELECT 
        m.user_id,
        NEW.mosque_id,
        'New Khairat Application',
        'A new khairat membership application has been submitted by ' || up.full_name,
        'application',
        json_build_object('type', 'khairat', 'application_id', NEW.id)::jsonb,
        now()
    FROM public.mosques m
    JOIN public.user_profiles up ON up.id = NEW.user_id
    WHERE m.id = NEW.mosque_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to notify admins of new khairat applications (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'notify_admin_new_khairat_application_trigger') THEN
    CREATE TRIGGER notify_admin_new_khairat_application_trigger
        AFTER INSERT ON public.khairat_applications
        FOR EACH ROW
        EXECUTE FUNCTION notify_admin_new_khairat_application();
  END IF;
END $$;
