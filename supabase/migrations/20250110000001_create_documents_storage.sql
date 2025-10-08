-- Migration: Create documents storage bucket for claim documents
-- This migration creates the storage bucket and sets up proper policies

-- Create the documents storage bucket (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 
  'documents',
  'documents',
  true, -- Public bucket so files can be accessed via URL
  10485760, -- 10MB file size limit
  ARRAY[
    'image/jpeg',
    'image/png', 
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'documents'
);

-- Create RLS policies for the documents bucket

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view claim documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload claim documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete claim documents" ON storage.objects;

-- Policy: Users can view documents for claims they have access to
CREATE POLICY "Users can view claim documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND
  (
    -- Users can view documents for their own claims
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      WHERE kc.id::text = (storage.foldername(name))[2] -- Extract claim ID from path
        AND kc.claimant_id = auth.uid()
    )
    OR
    -- Mosque admins can view documents for claims in their mosque
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      JOIN public.mosques m ON m.id = kc.mosque_id
      WHERE kc.id::text = (storage.foldername(name))[2] -- Extract claim ID from path
        AND m.user_id = auth.uid()
    )
  )
);

-- Policy: Users can upload documents for their own claims
CREATE POLICY "Users can upload claim documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL AND
  -- Check if the claim belongs to the user and is in pending/under_review status
  EXISTS (
    SELECT 1 FROM public.khairat_claims kc
    WHERE kc.id::text = (storage.foldername(name))[2] -- Extract claim ID from path
      AND kc.claimant_id = auth.uid()
      AND kc.status IN ('pending', 'under_review')
  )
);

-- Policy: Users can delete documents for their own claims
CREATE POLICY "Users can delete claim documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL AND
  (
    -- Users can delete documents for their own claims
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      WHERE kc.id::text = (storage.foldername(name))[2] -- Extract claim ID from path
        AND kc.claimant_id = auth.uid()
        AND kc.status IN ('pending', 'under_review')
    )
    OR
    -- Mosque admins can delete documents for claims in their mosque
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      JOIN public.mosques m ON m.id = kc.mosque_id
      WHERE kc.id::text = (storage.foldername(name))[2] -- Extract claim ID from path
        AND m.user_id = auth.uid()
        AND kc.status IN ('pending', 'under_review')
    )
  )
);

-- Enable RLS on storage.objects (should already be enabled, but just in case)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Migration completed successfully
-- The documents storage bucket is now ready for claim document uploads
