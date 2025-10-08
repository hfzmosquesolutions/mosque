-- Migration: Create documents storage bucket (simplified version)
-- This migration only creates the bucket, policies need to be set up manually

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

-- Note: Storage policies need to be created manually through the Supabase dashboard
-- or using the Supabase CLI with proper permissions
-- See setup-storage.md for manual setup instructions
