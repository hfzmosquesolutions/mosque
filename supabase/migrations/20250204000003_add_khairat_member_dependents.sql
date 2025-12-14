-- Add khairat_member_dependents table for storing dependents linked to khairat members
-- This allows admins to view and manage dependents (tanggugan) for each khairat member

CREATE TABLE public.khairat_member_dependents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  khairat_member_id uuid NOT NULL,
  full_name character varying NOT NULL,
  relationship character varying NOT NULL, -- e.g., 'spouse', 'child', 'parent', 'sibling'
  ic_passport_number character varying,
  date_of_birth date,
  gender character varying,
  phone character varying,
  email character varying,
  address text,
  emergency_contact boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT khairat_member_dependents_pkey PRIMARY KEY (id),
  CONSTRAINT khairat_member_dependents_khairat_member_id_fkey 
    FOREIGN KEY (khairat_member_id) 
    REFERENCES public.khairat_members(id) 
    ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.khairat_member_dependents ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view dependents for their own khairat memberships
CREATE POLICY "Users can view dependents for their own khairat memberships" 
  ON public.khairat_member_dependents
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.khairat_members km
      WHERE km.id = khairat_member_dependents.khairat_member_id
      AND km.user_id = auth.uid()
    )
  );

-- Mosque admins can view dependents for members of their mosques
CREATE POLICY "Mosque admins can view dependents for their mosque members" 
  ON public.khairat_member_dependents
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.khairat_members km
      JOIN public.mosques m ON km.mosque_id = m.id
      WHERE km.id = khairat_member_dependents.khairat_member_id
      AND m.user_id = auth.uid()
    )
  );

-- Users can insert dependents for their own khairat memberships
CREATE POLICY "Users can insert dependents for their own khairat memberships" 
  ON public.khairat_member_dependents
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.khairat_members km
      WHERE km.id = khairat_member_dependents.khairat_member_id
      AND km.user_id = auth.uid()
    )
  );

-- Mosque admins can insert dependents for members of their mosques
CREATE POLICY "Mosque admins can insert dependents for their mosque members" 
  ON public.khairat_member_dependents
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.khairat_members km
      JOIN public.mosques m ON km.mosque_id = m.id
      WHERE km.id = khairat_member_dependents.khairat_member_id
      AND m.user_id = auth.uid()
    )
  );

-- Users can update dependents for their own khairat memberships
CREATE POLICY "Users can update dependents for their own khairat memberships" 
  ON public.khairat_member_dependents
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.khairat_members km
      WHERE km.id = khairat_member_dependents.khairat_member_id
      AND km.user_id = auth.uid()
    )
  );

-- Mosque admins can update dependents for members of their mosques
CREATE POLICY "Mosque admins can update dependents for their mosque members" 
  ON public.khairat_member_dependents
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.khairat_members km
      JOIN public.mosques m ON km.mosque_id = m.id
      WHERE km.id = khairat_member_dependents.khairat_member_id
      AND m.user_id = auth.uid()
    )
  );

-- Users can delete dependents for their own khairat memberships
CREATE POLICY "Users can delete dependents for their own khairat memberships" 
  ON public.khairat_member_dependents
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.khairat_members km
      WHERE km.id = khairat_member_dependents.khairat_member_id
      AND km.user_id = auth.uid()
    )
  );

-- Mosque admins can delete dependents for members of their mosques
CREATE POLICY "Mosque admins can delete dependents for their mosque members" 
  ON public.khairat_member_dependents
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.khairat_members km
      JOIN public.mosques m ON km.mosque_id = m.id
      WHERE km.id = khairat_member_dependents.khairat_member_id
      AND m.user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT ALL PRIVILEGES ON public.khairat_member_dependents TO authenticated;
GRANT SELECT ON public.khairat_member_dependents TO anon;

-- Create indexes for better performance
CREATE INDEX idx_khairat_member_dependents_khairat_member_id 
  ON public.khairat_member_dependents(khairat_member_id);
CREATE INDEX idx_khairat_member_dependents_relationship 
  ON public.khairat_member_dependents(relationship);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_khairat_member_dependents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_khairat_member_dependents_updated_at
  BEFORE UPDATE ON public.khairat_member_dependents
  FOR EACH ROW
  EXECUTE FUNCTION update_khairat_member_dependents_updated_at();

