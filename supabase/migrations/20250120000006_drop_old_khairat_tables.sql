-- Migration: Drop old khairat_applications and khairat_memberships tables
-- This should be run after confirming the data migration was successful

-- Drop the old tables (uncomment when ready to remove them)
-- DROP TABLE IF EXISTS public.khairat_applications CASCADE;
-- DROP TABLE IF EXISTS public.khairat_memberships CASCADE;

-- For now, we'll keep the old tables but add a comment indicating they're deprecated
COMMENT ON TABLE public.khairat_applications IS 'DEPRECATED: Use khairat_members table instead. This table will be removed in a future migration.';
COMMENT ON TABLE public.khairat_memberships IS 'DEPRECATED: Use khairat_members table instead. This table will be removed in a future migration.';
