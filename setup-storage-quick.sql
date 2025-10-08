-- Quick Storage Setup for Claim Documents
-- Run this in the Supabase SQL Editor

-- 1. Create the documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 
  'documents',
  'documents',
  true,
  10485760, -- 10MB
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

-- 2. Create storage policies (run these one by one if needed)

-- Policy 1: View Documents
CREATE POLICY "Users can view claim documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND
  (
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      WHERE kc.id::text = (storage.foldername(name))[2]
        AND kc.claimant_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      JOIN public.mosques m ON m.id = kc.mosque_id
      WHERE kc.id::text = (storage.foldername(name))[2]
        AND m.user_id = auth.uid()
    )
  )
);

-- Policy 2: Upload Documents
CREATE POLICY "Users can upload claim documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.khairat_claims kc
    WHERE kc.id::text = (storage.foldername(name))[2]
      AND kc.claimant_id = auth.uid()
      AND kc.status IN ('pending', 'under_review')
  )
);

-- Policy 3: Delete Documents
CREATE POLICY "Users can delete claim documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL AND
  (
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      WHERE kc.id::text = (storage.foldername(name))[2]
        AND kc.claimant_id = auth.uid()
        AND kc.status IN ('pending', 'under_review')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      JOIN public.mosques m ON m.id = kc.mosque_id
      WHERE kc.id::text = (storage.foldername(name))[2]
        AND m.user_id = auth.uid()
        AND kc.status IN ('pending', 'under_review')
    )
  )
);
