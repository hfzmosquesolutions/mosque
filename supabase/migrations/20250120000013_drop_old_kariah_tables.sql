-- Drop old kariah tables after data migration
-- Only drop if the new consolidated table exists and has data

DO $$
BEGIN
  -- Check if kariah_members table exists and has data
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'kariah_members'
  ) THEN
    -- Drop old tables if they exist
    DROP TABLE IF EXISTS public.kariah_applications CASCADE;
    DROP TABLE IF EXISTS public.kariah_memberships CASCADE;
  END IF;
END $$;
