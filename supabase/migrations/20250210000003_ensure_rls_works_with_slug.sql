-- Ensure RLS policies work correctly with slug column
-- This migration verifies and fixes any RLS issues that might prevent mosque listing

-- Verify that the slug column exists and is accessible
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'mosques' 
    AND column_name = 'slug'
  ) THEN
    RAISE EXCEPTION 'Slug column does not exist. Please run slug migration first.';
  END IF;
END $$;

-- Ensure RLS is enabled on mosques table
ALTER TABLE public.mosques ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view public mosques" ON public.mosques;
DROP POLICY IF EXISTS "Users can view own mosques" ON public.mosques;

-- Recreate the public access policy - this allows anonymous and authenticated users
-- to view public mosques (is_private = false or NULL)
-- Note: We don't specify TO clause to allow both anon and authenticated
CREATE POLICY "Public can view public mosques" ON public.mosques
  FOR SELECT 
  USING (
    is_private = false OR is_private IS NULL
  );

-- Recreate the policy for mosque owners to view their own mosques (even if private)
CREATE POLICY "Users can view own mosques" ON public.mosques
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Ensure SELECT permissions are granted (including slug column)
-- This grants access to all columns including the slug
GRANT SELECT ON public.mosques TO anon;
GRANT SELECT ON public.mosques TO authenticated;

-- Verify that all public mosques have slugs
-- This will help identify any mosques that might be missing slugs
DO $$
DECLARE
  missing_slug_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_slug_count 
  FROM public.mosques 
  WHERE (is_private = false OR is_private IS NULL) 
    AND (slug IS NULL OR slug = '');
  
  IF missing_slug_count > 0 THEN
    RAISE NOTICE 'Warning: % public mosques are missing slugs. These may not be accessible via slug-based URLs.', missing_slug_count;
    
    -- Try to generate slugs for mosques that are missing them
    UPDATE public.mosques
    SET slug = generate_slug(name, city, state)
    WHERE (is_private = false OR is_private IS NULL) 
      AND (slug IS NULL OR slug = '');
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON POLICY "Public can view public mosques" ON public.mosques IS 
  'Allows anonymous and authenticated users to view public mosques (is_private = false or NULL). Works with slug column.';

-- Diagnostic: Check if there are any public mosques (for debugging)
DO $$
DECLARE
  public_mosque_count INTEGER;
  private_mosque_count INTEGER;
  total_mosque_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_mosque_count FROM public.mosques;
  SELECT COUNT(*) INTO public_mosque_count FROM public.mosques WHERE is_private = false OR is_private IS NULL;
  SELECT COUNT(*) INTO private_mosque_count FROM public.mosques WHERE is_private = true;
  
  RAISE NOTICE 'Mosque counts - Total: %, Public: %, Private: %', total_mosque_count, public_mosque_count, private_mosque_count;
  
  IF public_mosque_count = 0 AND total_mosque_count > 0 THEN
    RAISE WARNING 'No public mosques found! All mosques are marked as private. This will prevent public listing.';
  END IF;
END $$;
