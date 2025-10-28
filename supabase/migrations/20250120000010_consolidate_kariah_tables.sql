-- Migration: Consolidate kariah_applications and kariah_memberships into kariah_members
-- This streamlines the process by having a single table for both application and membership states

-- Create the new consolidated kariah_members table
CREATE TABLE IF NOT EXISTS public.kariah_members (
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
  membership_number varchar(50),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT kariah_members_pkey PRIMARY KEY (id),
  CONSTRAINT kariah_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  CONSTRAINT kariah_members_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES public.mosques(id) ON DELETE CASCADE,
  CONSTRAINT kariah_members_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kariah_members_user_id ON public.kariah_members(user_id);
CREATE INDEX IF NOT EXISTS idx_kariah_members_mosque_id ON public.kariah_members(mosque_id);
CREATE INDEX IF NOT EXISTS idx_kariah_members_status ON public.kariah_members(status);
CREATE INDEX IF NOT EXISTS idx_kariah_members_created_at ON public.kariah_members(created_at);
CREATE INDEX IF NOT EXISTS idx_kariah_members_membership_number ON public.kariah_members(membership_number);

-- Migrate data from kariah_applications (only if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kariah_applications') THEN
    INSERT INTO public.kariah_members (
      id, user_id, mosque_id, ic_passport_number, application_reason, 
      status, admin_notes, reviewed_by, reviewed_at, created_at, updated_at
    )
    SELECT 
      id, user_id, mosque_id, ic_passport_number, notes as application_reason,
      status, admin_notes, reviewed_by, reviewed_at, created_at, updated_at
    FROM public.kariah_applications
    WHERE NOT EXISTS (
      SELECT 1 FROM public.kariah_members km 
      WHERE km.id = kariah_applications.id
    );
  END IF;
END $$;

-- Migrate data from kariah_memberships (only if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kariah_memberships') THEN
    INSERT INTO public.kariah_members (
      id, user_id, mosque_id, status, joined_date, membership_number, 
      notes, admin_notes, created_at, updated_at
    )
    SELECT 
      id, user_id, mosque_id, status, joined_date, membership_number,
      notes, admin_notes, created_at, updated_at
    FROM public.kariah_memberships
    WHERE NOT EXISTS (
      SELECT 1 FROM public.kariah_members km 
      WHERE km.id = kariah_memberships.id
    );
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.kariah_members ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own records
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kariah_members' AND policyname = 'Users can view own kariah records') THEN
    CREATE POLICY "Users can view own kariah records" ON public.kariah_members
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

-- RLS Policy: Users can insert their own applications
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kariah_members' AND policyname = 'Users can insert own kariah applications') THEN
    CREATE POLICY "Users can insert own kariah applications" ON public.kariah_members
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- RLS Policy: Users can update their own applications (for withdrawal)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kariah_members' AND policyname = 'Users can update own kariah applications') THEN
    CREATE POLICY "Users can update own kariah applications" ON public.kariah_members
      FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;

-- RLS Policy: Mosque admins can manage records for their mosque
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kariah_members' AND policyname = 'Mosque admins can manage kariah records') THEN
    CREATE POLICY "Mosque admins can manage kariah records" ON public.kariah_members
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.mosques
          WHERE id = kariah_members.mosque_id
          AND user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- RLS Policy: System admins can manage all records
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kariah_members' AND policyname = 'System admins can manage all kariah records') THEN
    CREATE POLICY "System admins can manage all kariah records" ON public.kariah_members
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE id = auth.uid()
          AND role = 'admin'
        )
      );
  END IF;
END $$;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kariah_members TO authenticated;
GRANT SELECT ON public.kariah_members TO anon;
