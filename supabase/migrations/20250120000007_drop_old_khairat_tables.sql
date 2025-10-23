-- Migration: Drop old khairat_applications and khairat_memberships tables
-- This should be run after confirming the data migration was successful
-- and all applications have been updated to use the new consolidated API

-- Drop the old tables and their dependencies
DROP TABLE IF EXISTS public.khairat_applications CASCADE;
DROP TABLE IF EXISTS public.khairat_memberships CASCADE;

-- Drop any remaining indexes that might be orphaned
DROP INDEX IF EXISTS idx_khairat_applications_user_id;
DROP INDEX IF EXISTS idx_khairat_applications_mosque_id;
DROP INDEX IF EXISTS idx_khairat_applications_status;
DROP INDEX IF EXISTS idx_khairat_applications_created_at;

DROP INDEX IF EXISTS idx_khairat_memberships_user_id;
DROP INDEX IF EXISTS idx_khairat_memberships_mosque_id;
DROP INDEX IF EXISTS idx_khairat_memberships_status;

-- Add a comment to document the consolidation
COMMENT ON TABLE public.khairat_members IS 'Consolidated table for khairat applications and memberships. Replaces the old khairat_applications and khairat_memberships tables. Status values: pending, approved, rejected, under_review, withdrawn (application states), active, inactive, suspended (membership states)';
