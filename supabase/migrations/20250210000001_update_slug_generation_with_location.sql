-- Update slug generation to include location information
-- This migration updates the existing slug generation function and trigger
-- to handle similar mosque names by including city/state in the slug

-- First, ensure the slug column exists (in case first migration didn't complete)
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_set_mosque_slug ON public.mosques;

-- Drop existing function if it exists (we'll recreate it with better logic)
DROP FUNCTION IF EXISTS generate_slug(TEXT);
DROP FUNCTION IF EXISTS generate_slug(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS set_mosque_slug();

-- Recreate the improved slug generation function with location support
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
  WHILE EXISTS (SELECT 1 FROM public.mosques WHERE slug = unique_slug) LOOP
    counter := counter + 1;
    -- Append counter, but keep total length under 100
    unique_slug := left(slug_text, 95) || '-' || counter::TEXT;
  END LOOP;
  
  RETURN unique_slug;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger function with improved logic
CREATE OR REPLACE FUNCTION set_mosque_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  counter INTEGER := 0;
  unique_slug TEXT;
BEGIN
  -- Only generate slug if it's not already set
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.name, NEW.city, NEW.state);
  END IF;
  
  -- Ensure slug is unique (in case name changed but slug wasn't updated)
  -- Use sequential numbering instead of random for consistency
  base_slug := NEW.slug;
  unique_slug := base_slug;
  
  WHILE EXISTS (SELECT 1 FROM public.mosques WHERE slug = unique_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    -- Append counter, but keep total length under 100
    unique_slug := left(base_slug, 95) || '-' || counter::TEXT;
  END LOOP;
  
  NEW.slug := unique_slug;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_set_mosque_slug
  BEFORE INSERT OR UPDATE ON public.mosques
  FOR EACH ROW
  EXECUTE FUNCTION set_mosque_slug();

-- First, ensure the slug column exists (in case first migration didn't complete)
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
    
    -- Generate initial slugs for all mosques
    UPDATE public.mosques
    SET slug = generate_slug(name, city, state)
    WHERE slug IS NULL;
    
    -- Make slug NOT NULL after populating
    ALTER TABLE public.mosques ALTER COLUMN slug SET NOT NULL;
  END IF;
END $$;

-- Generate slugs for all mosques that don't have one yet
UPDATE public.mosques
SET slug = generate_slug(name, city, state)
WHERE slug IS NULL;

-- Update existing slugs to include location information (if they don't already have location)
-- This will regenerate slugs for existing mosques with location data
UPDATE public.mosques
SET slug = generate_slug(name, city, state)
WHERE slug IS NOT NULL 
  AND ((city IS NOT NULL AND city != '') OR (state IS NOT NULL AND state != ''))
  AND slug NOT LIKE '%-%'; -- Only update if slug doesn't already contain a hyphen (likely no location)

-- Make slug NOT NULL after populating (if not already)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'mosques' 
    AND column_name = 'slug'
    AND is_nullable = 'YES'
  ) THEN
    -- First ensure all rows have slugs
    UPDATE public.mosques SET slug = generate_slug(name, city, state) WHERE slug IS NULL;
    -- Then make it NOT NULL
    ALTER TABLE public.mosques ALTER COLUMN slug SET NOT NULL;
  END IF;
END $$;

-- Note: Mosques without location data will keep their existing slugs
-- unless there are duplicates, in which case they'll get numbered when updated
