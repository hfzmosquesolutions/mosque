-- Add user dependents table for storing family member information

CREATE TABLE public.user_dependents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  full_name character varying NOT NULL,
  relationship character varying NOT NULL, -- e.g., 'spouse', 'child', 'parent', 'sibling'
  date_of_birth date,
  gender character varying,
  phone character varying,
  email character varying,
  address text,
  emergency_contact boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_dependents_pkey PRIMARY KEY (id),
  CONSTRAINT user_dependents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.user_dependents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own dependents" ON public.user_dependents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dependents" ON public.user_dependents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dependents" ON public.user_dependents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dependents" ON public.user_dependents
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT ALL PRIVILEGES ON public.user_dependents TO authenticated;
GRANT SELECT ON public.user_dependents TO anon;

-- Create indexes for better performance
CREATE INDEX idx_user_dependents_user_id ON public.user_dependents(user_id);
CREATE INDEX idx_user_dependents_relationship ON public.user_dependents(relationship);