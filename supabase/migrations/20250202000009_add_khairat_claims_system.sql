-- Migration: Add Khairat Claims System
-- This migration creates the claims system where users can claim khairat assistance
-- and mosque admins can manage those claims

-- Create claim status enum
CREATE TYPE claim_status AS ENUM (
  'pending',
  'under_review', 
  'approved',
  'rejected',
  'disbursed',
  'cancelled'
);

-- Create claim priority enum
CREATE TYPE claim_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Create khairat_claims table
CREATE TABLE public.khairat_claims (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  mosque_id uuid NOT NULL,
  claimant_id uuid NOT NULL,
  program_id uuid,
  title character varying(255) NOT NULL,
  description text NOT NULL,
  requested_amount numeric(10,2) NOT NULL,
  approved_amount numeric(10,2),
  status claim_status DEFAULT 'pending',
  priority claim_priority DEFAULT 'medium',
  reason_category character varying(100),
  supporting_documents jsonb DEFAULT '[]'::jsonb,
  admin_notes text,
  rejection_reason text,
  disbursement_method character varying(50),
  disbursement_reference character varying(255),
  disbursed_at timestamp with time zone,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  approved_by uuid,
  approved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT khairat_claims_pkey PRIMARY KEY (id),
  CONSTRAINT khairat_claims_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES public.mosques(id) ON DELETE CASCADE,
  CONSTRAINT khairat_claims_claimant_id_fkey FOREIGN KEY (claimant_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  CONSTRAINT khairat_claims_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.contribution_programs(id) ON DELETE SET NULL,
  CONSTRAINT khairat_claims_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  CONSTRAINT khairat_claims_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  CONSTRAINT khairat_claims_requested_amount_positive CHECK (requested_amount > 0),
  CONSTRAINT khairat_claims_approved_amount_positive CHECK (approved_amount IS NULL OR approved_amount >= 0)
);

-- Create claim_documents table for file attachments
CREATE TABLE public.claim_documents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  claim_id uuid NOT NULL,
  file_name character varying(255) NOT NULL,
  file_url text NOT NULL,
  file_type character varying(50),
  file_size integer,
  uploaded_by uuid NOT NULL,
  uploaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT claim_documents_pkey PRIMARY KEY (id),
  CONSTRAINT claim_documents_claim_id_fkey FOREIGN KEY (claim_id) REFERENCES public.khairat_claims(id) ON DELETE CASCADE,
  CONSTRAINT claim_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.user_profiles(id) ON DELETE CASCADE
);

-- Create claim_history table for audit trail
CREATE TABLE public.claim_history (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  claim_id uuid NOT NULL,
  action character varying(50) NOT NULL,
  old_status claim_status,
  new_status claim_status,
  notes text,
  performed_by uuid NOT NULL,
  performed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT claim_history_pkey PRIMARY KEY (id),
  CONSTRAINT claim_history_claim_id_fkey FOREIGN KEY (claim_id) REFERENCES public.khairat_claims(id) ON DELETE CASCADE,
  CONSTRAINT claim_history_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.user_profiles(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_khairat_claims_mosque_id ON public.khairat_claims(mosque_id);
CREATE INDEX idx_khairat_claims_claimant_id ON public.khairat_claims(claimant_id);
CREATE INDEX idx_khairat_claims_status ON public.khairat_claims(status);
CREATE INDEX idx_khairat_claims_priority ON public.khairat_claims(priority);
CREATE INDEX idx_khairat_claims_created_at ON public.khairat_claims(created_at);
CREATE INDEX idx_khairat_claims_program_id ON public.khairat_claims(program_id);
CREATE INDEX idx_claim_documents_claim_id ON public.claim_documents(claim_id);
CREATE INDEX idx_claim_history_claim_id ON public.claim_history(claim_id);
CREATE INDEX idx_claim_history_performed_at ON public.claim_history(performed_at);

-- Add updated_at trigger for khairat_claims
CREATE TRIGGER update_khairat_claims_updated_at 
  BEFORE UPDATE ON public.khairat_claims 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create claim history entries
CREATE OR REPLACE FUNCTION create_claim_history_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create history entry if status changed
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.claim_history (
      claim_id,
      action,
      old_status,
      new_status,
      notes,
      performed_by
    ) VALUES (
      NEW.id,
      'status_change',
      OLD.status,
      NEW.status,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Claim approved'
        WHEN NEW.status = 'rejected' THEN 'Claim rejected: ' || COALESCE(NEW.rejection_reason, 'No reason provided')
        WHEN NEW.status = 'under_review' THEN 'Claim moved to review'
        WHEN NEW.status = 'disbursed' THEN 'Claim disbursed'
        WHEN NEW.status = 'cancelled' THEN 'Claim cancelled'
        ELSE 'Status changed'
      END,
      COALESCE(NEW.reviewed_by, NEW.approved_by, NEW.claimant_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic claim history
CREATE TRIGGER khairat_claims_history_trigger
  AFTER UPDATE ON public.khairat_claims
  FOR EACH ROW EXECUTE FUNCTION create_claim_history_entry();

-- Enable RLS on new tables
ALTER TABLE public.khairat_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for khairat_claims
-- Users can view their own claims
CREATE POLICY "Users can view their own claims" ON public.khairat_claims
  FOR SELECT USING (auth.uid() = claimant_id);

-- Users can create claims for themselves
CREATE POLICY "Users can create their own claims" ON public.khairat_claims
  FOR INSERT WITH CHECK (auth.uid() = claimant_id);

-- Users can update their own pending claims
CREATE POLICY "Users can update their own pending claims" ON public.khairat_claims
  FOR UPDATE USING (
    auth.uid() = claimant_id AND 
    status IN ('pending', 'under_review')
  );

-- Mosque admins can view all claims for their mosque
CREATE POLICY "Mosque admins can view all claims" ON public.khairat_claims
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mosques m
      WHERE m.id = khairat_claims.mosque_id 
        AND m.user_id = auth.uid()
    )
  );

-- Mosque admins can update claims in their mosque
CREATE POLICY "Mosque admins can update claims" ON public.khairat_claims
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.mosques m
      WHERE m.id = khairat_claims.mosque_id 
        AND m.user_id = auth.uid()
    )
  );

-- RLS Policies for claim_documents
-- Users can view documents for their own claims
CREATE POLICY "Users can view their own claim documents" ON public.claim_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      WHERE kc.id = claim_documents.claim_id 
        AND kc.claimant_id = auth.uid()
    )
  );

-- Users can upload documents for their own claims
CREATE POLICY "Users can upload documents for their claims" ON public.claim_documents
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      WHERE kc.id = claim_documents.claim_id 
        AND kc.claimant_id = auth.uid()
        AND kc.status IN ('pending', 'under_review')
    )
  );

-- Mosque admins can view all claim documents for their mosque
CREATE POLICY "Mosque admins can view all claim documents" ON public.claim_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      JOIN public.mosques m ON m.id = kc.mosque_id
      WHERE kc.id = claim_documents.claim_id
        AND m.user_id = auth.uid()
    )
  );

-- RLS Policies for claim_history
-- Users can view history for their own claims
CREATE POLICY "Users can view their own claim history" ON public.claim_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      WHERE kc.id = claim_history.claim_id 
        AND kc.claimant_id = auth.uid()
    )
  );

-- Mosque admins can view all claim history for their mosque
CREATE POLICY "Mosque admins can view all claim history" ON public.claim_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      JOIN public.mosques m ON m.id = kc.mosque_id
      WHERE kc.id = claim_history.claim_id
        AND m.user_id = auth.uid()
    )
  );

-- System can insert claim history (for triggers)
CREATE POLICY "System can insert claim history" ON public.claim_history
  FOR INSERT WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE public.khairat_claims IS 'Claims submitted by users for khairat assistance';
COMMENT ON TABLE public.claim_documents IS 'Supporting documents uploaded for claims';
COMMENT ON TABLE public.claim_history IS 'Audit trail for claim status changes and actions';
COMMENT ON COLUMN public.khairat_claims.supporting_documents IS 'JSON array of document metadata for backward compatibility';
COMMENT ON COLUMN public.khairat_claims.reason_category IS 'Category of assistance needed (medical, education, housing, etc.)';
COMMENT ON COLUMN public.khairat_claims.disbursement_method IS 'Method of disbursement (bank_transfer, cash, cheque, etc.)';