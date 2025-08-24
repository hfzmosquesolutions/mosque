-- Add logo_url and banner_url fields to mosques table
ALTER TABLE mosques 
ADD COLUMN logo_url TEXT,
ADD COLUMN banner_url TEXT;

-- Add comments for the new columns
COMMENT ON COLUMN mosques.logo_url IS 'URL to the mosque logo image stored in Supabase storage';
COMMENT ON COLUMN mosques.banner_url IS 'URL to the mosque banner image stored in Supabase storage';

-- Create storage bucket for mosque images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('mosque-images', 'mosque-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for mosque images
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload mosque images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'mosque-images' AND
  auth.role() = 'authenticated'
);

-- Allow public read access to mosque images
CREATE POLICY "Public can view mosque images" ON storage.objects
FOR SELECT USING (bucket_id = 'mosque-images');

-- Allow mosque admins to update/delete their mosque images
CREATE POLICY "Mosque admins can manage their mosque images" ON storage.objects
FOR ALL USING (
  bucket_id = 'mosque-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);