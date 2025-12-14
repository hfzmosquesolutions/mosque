-- Migration: Add payment receipts table for bank transfer payments
-- This allows users to upload receipt documents instead of just entering a reference number

-- Create khairat_payment_receipts table
CREATE TABLE IF NOT EXISTS public.khairat_payment_receipts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  contribution_id uuid NOT NULL,
  file_name character varying(255) NOT NULL,
  file_url text NOT NULL,
  file_type character varying(50),
  file_size integer,
  uploaded_by uuid,
  uploaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT khairat_payment_receipts_pkey PRIMARY KEY (id),
  CONSTRAINT khairat_payment_receipts_contribution_id_fkey FOREIGN KEY (contribution_id) REFERENCES public.khairat_contributions(id) ON DELETE CASCADE,
  CONSTRAINT khairat_payment_receipts_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_khairat_payment_receipts_contribution_id ON public.khairat_payment_receipts(contribution_id);
CREATE INDEX IF NOT EXISTS idx_khairat_payment_receipts_uploaded_by ON public.khairat_payment_receipts(uploaded_by);

-- Enable RLS
ALTER TABLE public.khairat_payment_receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for khairat_payment_receipts

-- Users can view receipts for their own contributions
CREATE POLICY "Users can view their own payment receipts" ON public.khairat_payment_receipts
  FOR SELECT USING (
    -- If uploaded_by matches authenticated user
    (uploaded_by IS NOT NULL AND uploaded_by = auth.uid())
    OR
    -- If contribution belongs to authenticated user
    EXISTS (
      SELECT 1 FROM public.khairat_contributions kc
      WHERE kc.id = khairat_payment_receipts.contribution_id
        AND kc.contributor_id = auth.uid()
    )
    OR
    -- If contribution has NULL contributor_id (anonymous), allow if uploaded_by matches
    EXISTS (
      SELECT 1 FROM public.khairat_contributions kc
      WHERE kc.id = khairat_payment_receipts.contribution_id
        AND kc.contributor_id IS NULL
        AND khairat_payment_receipts.uploaded_by = auth.uid()
    )
    OR
    -- Mosque admins can view all receipts for their mosque
    EXISTS (
      SELECT 1 FROM public.khairat_contributions kc
      JOIN public.mosques m ON m.id = kc.mosque_id
      WHERE kc.id = khairat_payment_receipts.contribution_id
        AND m.user_id = auth.uid()
    )
  );

-- Anonymous users can view receipts for contributions with NULL contributor_id
CREATE POLICY "Anonymous users can view payment receipts" ON public.khairat_payment_receipts
  FOR SELECT 
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.khairat_contributions kc
      WHERE kc.id = khairat_payment_receipts.contribution_id
        AND kc.contributor_id IS NULL
    )
  );

-- Users can upload receipts for their own contributions
CREATE POLICY "Users can upload payment receipts" ON public.khairat_payment_receipts
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    -- Must be uploaded by authenticated user
    uploaded_by = auth.uid()
    AND
    (
      -- Contribution belongs to authenticated user
      EXISTS (
        SELECT 1 FROM public.khairat_contributions kc
        WHERE kc.id = khairat_payment_receipts.contribution_id
          AND kc.contributor_id = auth.uid()
      )
      OR
      -- Contribution has NULL contributor_id (anonymous payment by logged-in user)
      EXISTS (
        SELECT 1 FROM public.khairat_contributions kc
        WHERE kc.id = khairat_payment_receipts.contribution_id
          AND kc.contributor_id IS NULL
      )
    )
  );

-- Anonymous users can upload receipts for contributions with NULL contributor_id
CREATE POLICY "Anonymous users can upload payment receipts" ON public.khairat_payment_receipts
  FOR INSERT 
  TO anon
  WITH CHECK (
    uploaded_by IS NULL
    AND
    EXISTS (
      SELECT 1 FROM public.khairat_contributions kc
      WHERE kc.id = khairat_payment_receipts.contribution_id
        AND kc.contributor_id IS NULL
    )
  );

-- Users can delete their own receipts (only if contribution is still pending)
CREATE POLICY "Users can delete their own payment receipts" ON public.khairat_payment_receipts
  FOR DELETE 
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM public.khairat_contributions kc
      WHERE kc.id = khairat_payment_receipts.contribution_id
        AND kc.status = 'pending'
    )
  );

-- Mosque admins can delete receipts for their mosque
CREATE POLICY "Mosque admins can delete payment receipts" ON public.khairat_payment_receipts
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.khairat_contributions kc
      JOIN public.mosques m ON m.id = kc.mosque_id
      WHERE kc.id = khairat_payment_receipts.contribution_id
        AND m.user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.khairat_payment_receipts TO authenticated;
GRANT SELECT, INSERT ON public.khairat_payment_receipts TO anon;

