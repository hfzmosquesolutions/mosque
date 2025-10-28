-- Migration: Rename claim tables to khairat_claim tables for consistency
-- This migration renames claim_documents and claim_history to khairat_claim_documents and khairat_claim_history

-- Step 1: Drop existing RLS policies (they will be recreated with new names)
DROP POLICY IF EXISTS "Users can view their own claim documents" ON public.claim_documents;
DROP POLICY IF EXISTS "Users can upload documents for their claims" ON public.claim_documents;
DROP POLICY IF EXISTS "Mosque admins can view all claim documents" ON public.claim_documents;
DROP POLICY IF EXISTS "Users can view their own claim history" ON public.claim_history;
DROP POLICY IF EXISTS "Mosque admins can view all claim history" ON public.claim_history;
DROP POLICY IF EXISTS "System can insert claim history" ON public.claim_history;

-- Step 2: Drop existing indexes (they will be recreated with new names)
DROP INDEX IF EXISTS idx_claim_documents_claim_id;
DROP INDEX IF EXISTS idx_claim_history_claim_id;
DROP INDEX IF EXISTS idx_claim_history_performed_at;

-- Step 3: Drop existing foreign key constraints (they will be recreated with new names)
ALTER TABLE public.claim_documents DROP CONSTRAINT IF EXISTS claim_documents_claim_id_fkey;
ALTER TABLE public.claim_documents DROP CONSTRAINT IF EXISTS claim_documents_uploaded_by_fkey;
ALTER TABLE public.claim_history DROP CONSTRAINT IF EXISTS claim_history_claim_id_fkey;
ALTER TABLE public.claim_history DROP CONSTRAINT IF EXISTS claim_history_performed_by_fkey;

-- Step 4: Rename tables
ALTER TABLE public.claim_documents RENAME TO khairat_claim_documents;
ALTER TABLE public.claim_history RENAME TO khairat_claim_history;

-- Step 5: Recreate foreign key constraints with new names
ALTER TABLE public.khairat_claim_documents 
  ADD CONSTRAINT khairat_claim_documents_claim_id_fkey 
  FOREIGN KEY (claim_id) REFERENCES public.khairat_claims(id) ON DELETE CASCADE;

ALTER TABLE public.khairat_claim_documents 
  ADD CONSTRAINT khairat_claim_documents_uploaded_by_fkey 
  FOREIGN KEY (uploaded_by) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.khairat_claim_history 
  ADD CONSTRAINT khairat_claim_history_claim_id_fkey 
  FOREIGN KEY (claim_id) REFERENCES public.khairat_claims(id) ON DELETE CASCADE;

ALTER TABLE public.khairat_claim_history 
  ADD CONSTRAINT khairat_claim_history_performed_by_fkey 
  FOREIGN KEY (performed_by) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Step 6: Recreate indexes with new names
CREATE INDEX idx_khairat_claim_documents_claim_id ON public.khairat_claim_documents(claim_id);
CREATE INDEX idx_khairat_claim_history_claim_id ON public.khairat_claim_history(claim_id);
CREATE INDEX idx_khairat_claim_history_performed_at ON public.khairat_claim_history(performed_at);

-- Step 7: Recreate RLS policies with new names
-- RLS Policies for khairat_claim_documents
CREATE POLICY "Users can view their own khairat claim documents" ON public.khairat_claim_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      WHERE kc.id = khairat_claim_documents.claim_id 
        AND kc.claimant_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload documents for their khairat claims" ON public.khairat_claim_documents
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      WHERE kc.id = khairat_claim_documents.claim_id 
        AND kc.claimant_id = auth.uid()
        AND kc.status IN ('pending', 'under_review')
    )
  );

CREATE POLICY "Mosque admins can view all khairat claim documents" ON public.khairat_claim_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      JOIN public.mosques m ON m.id = kc.mosque_id
      WHERE kc.id = khairat_claim_documents.claim_id
        AND m.user_id = auth.uid()
    )
  );

-- RLS Policies for khairat_claim_history
CREATE POLICY "Users can view their own khairat claim history" ON public.khairat_claim_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      WHERE kc.id = khairat_claim_history.claim_id 
        AND kc.claimant_id = auth.uid()
    )
  );

CREATE POLICY "Mosque admins can view all khairat claim history" ON public.khairat_claim_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      JOIN public.mosques m ON m.id = kc.mosque_id
      WHERE kc.id = khairat_claim_history.claim_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert khairat claim history" ON public.khairat_claim_history
  FOR INSERT WITH CHECK (true);

-- Step 8: Update the trigger function to use the new table name
CREATE OR REPLACE FUNCTION create_claim_history_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create history entry if status changed
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.khairat_claim_history (
      claim_id,
      action,
      old_status,
      new_status,
      notes,
      performed_by,
      performed_at
    ) VALUES (
      NEW.id,
      'status_change',
      OLD.status,
      NEW.status,
      'Status changed from ' || OLD.status || ' to ' || NEW.status,
      COALESCE(NEW.reviewed_by, NEW.approved_by, auth.uid()),
      NOW()
    );
  END IF;

  -- Create history entry for other important changes
  IF TG_OP = 'UPDATE' AND (
    OLD.approved_amount IS DISTINCT FROM NEW.approved_amount OR
    OLD.rejection_reason IS DISTINCT FROM NEW.rejection_reason OR
    OLD.admin_notes IS DISTINCT FROM NEW.admin_notes
  ) THEN
    INSERT INTO public.khairat_claim_history (
      claim_id,
      action,
      old_status,
      new_status,
      notes,
      performed_by,
      performed_at
    ) VALUES (
      NEW.id,
      'claim_updated',
      OLD.status,
      NEW.status,
      'Claim details updated',
      COALESCE(NEW.reviewed_by, NEW.approved_by, auth.uid()),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Update table comments
COMMENT ON TABLE public.khairat_claim_documents IS 'Supporting documents uploaded for khairat claims';
COMMENT ON TABLE public.khairat_claim_history IS 'Audit trail for khairat claim status changes and actions';

-- Step 10: Update column comments
COMMENT ON COLUMN public.khairat_claim_documents.claim_id IS 'Reference to the khairat claim this document supports';
COMMENT ON COLUMN public.khairat_claim_history.claim_id IS 'Reference to the khairat claim this history entry belongs to';

-- Migration completed successfully
-- All tables, constraints, indexes, policies, and triggers have been updated
-- to use the new khairat_claim_* naming convention for consistency

