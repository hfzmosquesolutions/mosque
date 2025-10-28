-- Migration: Consolidate khairat_applications and khairat_memberships into khairat_members
-- This streamlines the process by having a single table for both application and membership states

-- Create the new consolidated khairat_members table
CREATE TABLE IF NOT EXISTS public.khairat_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  mosque_id uuid NOT NULL,
  ic_passport_number varchar(20),
  application_reason text,
  status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review', 'withdrawn', 'active', 'inactive', 'suspended')),
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  joined_date date,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT khairat_members_pkey PRIMARY KEY (id),
  CONSTRAINT khairat_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  CONSTRAINT khairat_members_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES public.mosques(id) ON DELETE CASCADE,
  CONSTRAINT khairat_members_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_khairat_members_user_id ON public.khairat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_khairat_members_mosque_id ON public.khairat_members(mosque_id);
CREATE INDEX IF NOT EXISTS idx_khairat_members_status ON public.khairat_members(status);
CREATE INDEX IF NOT EXISTS idx_khairat_members_created_at ON public.khairat_members(created_at);

-- Migrate data from khairat_applications (only if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'khairat_applications') THEN
    INSERT INTO public.khairat_members (
      id, user_id, mosque_id, ic_passport_number, application_reason,
      status, admin_notes, reviewed_by, reviewed_at, created_at, updated_at
    )
    SELECT 
      id, user_id, mosque_id, ic_passport_number, application_reason,
      status, admin_notes, reviewed_by, reviewed_at, created_at, updated_at
    FROM public.khairat_applications
    WHERE NOT EXISTS (
      SELECT 1 FROM public.khairat_members WHERE id = khairat_applications.id
    );
  END IF;
END $$;

-- Migrate data from khairat_memberships (only if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'khairat_memberships') THEN
    INSERT INTO public.khairat_members (
      id, user_id, mosque_id, status, joined_date, notes, created_at, updated_at
    )
    SELECT 
      id, user_id, mosque_id, 
      CASE 
        WHEN status = 'active' THEN 'active'
        WHEN status = 'inactive' THEN 'inactive' 
        WHEN status = 'suspended' THEN 'suspended'
        ELSE 'active'
      END as status,
      joined_date, notes, created_at, updated_at
    FROM public.khairat_memberships
    WHERE NOT EXISTS (
      SELECT 1 FROM public.khairat_members WHERE id = khairat_memberships.id
    );
  END IF;
END $$;

-- Enable RLS on the new table
ALTER TABLE public.khairat_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for khairat_members
-- Users can view their own records
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khairat_members' AND policyname = 'Users can view own khairat records') THEN
    CREATE POLICY "Users can view own khairat records" ON public.khairat_members
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can insert their own records
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khairat_members' AND policyname = 'Users can insert own khairat records') THEN
    CREATE POLICY "Users can insert own khairat records" ON public.khairat_members
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Users can update their own records (for withdrawal)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khairat_members' AND policyname = 'Users can update own khairat records') THEN
    CREATE POLICY "Users can update own khairat records" ON public.khairat_members
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Mosque admins can view all records for their mosque
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khairat_members' AND policyname = 'Mosque admins can view all khairat records') THEN
    CREATE POLICY "Mosque admins can view all khairat records" ON public.khairat_members
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.mosques 
          WHERE id = khairat_members.mosque_id 
          AND user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Mosque admins can update all records for their mosque
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khairat_members' AND policyname = 'Mosque admins can update all khairat records') THEN
    CREATE POLICY "Mosque admins can update all khairat records" ON public.khairat_members
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.mosques 
          WHERE id = khairat_members.mosque_id 
          AND user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- System admins can view all records
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khairat_members' AND policyname = 'System admins can view all khairat records') THEN
    CREATE POLICY "System admins can view all khairat records" ON public.khairat_members
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      );
  END IF;
END $$;

-- System admins can update all records
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'khairat_members' AND policyname = 'System admins can update all khairat records') THEN
    CREATE POLICY "System admins can update all khairat records" ON public.khairat_members
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      );
  END IF;
END $$;

-- Add a comment explaining the consolidated table
COMMENT ON TABLE public.khairat_members IS 'Consolidated table for khairat applications and memberships. Status values: pending, approved, rejected, under_review, withdrawn (application states), active, inactive, suspended (membership states)';
COMMENT ON COLUMN public.khairat_members.status IS 'Combined status for both application and membership states. Application states: pending, approved, rejected, under_review, withdrawn. Membership states: active, inactive, suspended';
COMMENT ON COLUMN public.khairat_members.joined_date IS 'Date when the member joined (only set for approved/active members)';
COMMENT ON COLUMN public.khairat_members.notes IS 'General notes about the member (replaces both admin_notes and notes from separate tables)';
