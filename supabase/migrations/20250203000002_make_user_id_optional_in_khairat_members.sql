-- Migration: Make user_id optional in khairat_members table
-- This allows admins to register members directly without requiring them to have an account
-- Members can be identified by IC number or membership number for payment purposes

-- Add fields to store member data directly when user_id is NULL
ALTER TABLE public.khairat_members 
ADD COLUMN IF NOT EXISTS full_name varchar(255),
ADD COLUMN IF NOT EXISTS phone varchar(20),
ADD COLUMN IF NOT EXISTS email varchar(255),
ADD COLUMN IF NOT EXISTS address text;

-- Make user_id nullable
ALTER TABLE public.khairat_members 
ALTER COLUMN user_id DROP NOT NULL;

-- Update foreign key constraint to allow NULL and change ON DELETE behavior
ALTER TABLE public.khairat_members
DROP CONSTRAINT IF EXISTS khairat_members_user_id_fkey;

ALTER TABLE public.khairat_members
ADD CONSTRAINT khairat_members_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.user_profiles(id) 
ON DELETE SET NULL;

-- Remove old constraint if exists and add new one
-- Allow user_id to exist with or without direct data fields
-- OR allow direct data fields when user_id is NULL
ALTER TABLE public.khairat_members
DROP CONSTRAINT IF EXISTS khairat_members_user_or_direct_data_check;

-- New constraint: If user_id is NULL, then full_name and ic_passport_number must be provided
-- If user_id is NOT NULL, direct data fields are optional (can be stored for all users)
ALTER TABLE public.khairat_members
ADD CONSTRAINT khairat_members_user_or_direct_data_check 
CHECK (
  (user_id IS NOT NULL) OR 
  (full_name IS NOT NULL AND ic_passport_number IS NOT NULL)
);

-- Update unique constraint to allow multiple members with same IC if user_id is NULL
-- But ensure IC + mosque_id is unique when user_id is NULL
DROP INDEX IF EXISTS idx_khairat_members_user_mosque_unique;

-- Create unique constraint: (user_id, mosque_id) when user_id is NOT NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_khairat_members_user_mosque_unique 
ON public.khairat_members(user_id, mosque_id) 
WHERE user_id IS NOT NULL;

-- Create unique constraint: (ic_passport_number, mosque_id) when user_id is NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_khairat_members_ic_mosque_unique 
ON public.khairat_members(ic_passport_number, mosque_id) 
WHERE user_id IS NULL AND ic_passport_number IS NOT NULL;

-- Update RLS policies to handle NULL user_id
-- Users can view their own records (only if user_id matches)
DROP POLICY IF EXISTS "Users can view own khairat records" ON public.khairat_members;
CREATE POLICY "Users can view own khairat records" ON public.khairat_members
  FOR SELECT USING (
    user_id IS NOT NULL AND auth.uid() = user_id
  );

-- Users can insert their own records (only if user_id matches)
DROP POLICY IF EXISTS "Users can insert own khairat records" ON public.khairat_members;
CREATE POLICY "Users can insert own khairat records" ON public.khairat_members
  FOR INSERT WITH CHECK (
    user_id IS NOT NULL AND auth.uid() = user_id
  );

-- Users can update their own records (only if user_id matches)
DROP POLICY IF EXISTS "Users can update own khairat records" ON public.khairat_members;
CREATE POLICY "Users can update own khairat records" ON public.khairat_members
  FOR UPDATE USING (
    user_id IS NOT NULL AND auth.uid() = user_id
  );

-- Mosque admins can view all records for their mosque (including NULL user_id records)
DROP POLICY IF EXISTS "Mosque admins can view all khairat records" ON public.khairat_members;
CREATE POLICY "Mosque admins can view all khairat records" ON public.khairat_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mosques 
      WHERE id = khairat_members.mosque_id 
      AND user_id = auth.uid()
    )
  );

-- Mosque admins can insert records for their mosque (including NULL user_id records)
DROP POLICY IF EXISTS "Mosque admins can insert khairat records" ON public.khairat_members;
CREATE POLICY "Mosque admins can insert khairat records" ON public.khairat_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mosques 
      WHERE id = khairat_members.mosque_id 
      AND user_id = auth.uid()
    )
  );

-- Mosque admins can update all records for their mosque (including NULL user_id records)
DROP POLICY IF EXISTS "Mosque admins can update all khairat records" ON public.khairat_members;
CREATE POLICY "Mosque admins can update all khairat records" ON public.khairat_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.mosques 
      WHERE id = khairat_members.mosque_id 
      AND user_id = auth.uid()
    )
  );

-- Add indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_khairat_members_full_name 
ON public.khairat_members(full_name);

CREATE INDEX IF NOT EXISTS idx_khairat_members_phone 
ON public.khairat_members(phone);

CREATE INDEX IF NOT EXISTS idx_khairat_members_ic_passport_number 
ON public.khairat_members(ic_passport_number);

