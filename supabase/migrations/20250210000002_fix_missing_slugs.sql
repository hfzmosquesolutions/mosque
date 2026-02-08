-- Fix any mosques that might be missing slugs
-- This migration ensures all mosques have slugs, even if previous migrations failed

-- First, ensure slug column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'mosques' 
    AND column_name = 'slug'
  ) THEN
    -- Add slug column if it doesn't exist
    ALTER TABLE public.mosques ADD COLUMN slug TEXT;
    
    -- Create unique index on slug
    CREATE UNIQUE INDEX IF NOT EXISTS idx_mosques_slug ON public.mosques(slug) WHERE slug IS NOT NULL;
  END IF;
END $$;

-- Ensure the generate_slug function exists
CREATE OR REPLACE FUNCTION generate_slug(mosque_name TEXT, mosque_city TEXT DEFAULT NULL, mosque_state TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  slug_text TEXT;
  location_part TEXT := '';
  counter INTEGER := 0;
  unique_slug TEXT;
BEGIN
  -- Convert name to lowercase, replace spaces and special chars with hyphens
  slug_text := lower(trim(mosque_name));
  -- Remove special characters, keep only alphanumeric, spaces, and hyphens
  slug_text := regexp_replace(slug_text, '[^a-z0-9\s-]', '', 'g');
  -- Replace multiple spaces/hyphens with single hyphen
  slug_text := regexp_replace(slug_text, '[\s-]+', '-', 'g');
  -- Remove leading/trailing hyphens
  slug_text := trim(both '-' from slug_text);
  
  -- Add location information to make slug more unique (prefer city, fallback to state)
  IF mosque_city IS NOT NULL AND mosque_city != '' THEN
    location_part := lower(trim(mosque_city));
    location_part := regexp_replace(location_part, '[^a-z0-9\s-]', '', 'g');
    location_part := regexp_replace(location_part, '[\s-]+', '-', 'g');
    location_part := trim(both '-' from location_part);
    IF location_part != '' THEN
      slug_text := slug_text || '-' || location_part;
    END IF;
  ELSIF mosque_state IS NOT NULL AND mosque_state != '' THEN
    location_part := lower(trim(mosque_state));
    location_part := regexp_replace(location_part, '[^a-z0-9\s-]', '', 'g');
    location_part := regexp_replace(location_part, '[\s-]+', '-', 'g');
    location_part := trim(both '-' from location_part);
    IF location_part != '' THEN
      slug_text := slug_text || '-' || location_part;
    END IF;
  END IF;
  
  -- Limit length to 100 characters
  slug_text := left(slug_text, 100);
  
  -- If empty after processing, use a default
  IF slug_text = '' OR slug_text IS NULL THEN
    slug_text := 'mosque';
  END IF;
  
  unique_slug := slug_text;
  
  -- Check if slug exists, if so append a number
  WHILE EXISTS (SELECT 1 FROM public.mosques WHERE slug = unique_slug AND slug IS NOT NULL) LOOP
    counter := counter + 1;
    -- Append counter, but keep total length under 100
    unique_slug := left(slug_text, 95) || '-' || counter::TEXT;
  END LOOP;
  
  RETURN unique_slug;
END;
$$ LANGUAGE plpgsql;

-- Generate slugs for all mosques that don't have one
UPDATE public.mosques
SET slug = generate_slug(name, city, state)
WHERE slug IS NULL OR slug = '';

-- Now make slug NOT NULL (but allow it to be nullable temporarily if migration is still running)
-- Only set NOT NULL if all rows have slugs
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM public.mosques WHERE slug IS NULL OR slug = '';
  
  IF null_count = 0 THEN
    -- All mosques have slugs, make it NOT NULL
    ALTER TABLE public.mosques ALTER COLUMN slug SET NOT NULL;
  ELSE
    -- Some mosques still don't have slugs, keep it nullable for now
    RAISE NOTICE 'Warning: % mosques still missing slugs. Keeping column nullable.', null_count;
  END IF;
END $$;
