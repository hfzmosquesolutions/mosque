-- Remove follow/following system
-- This migration drops all tables, functions, and policies related to the follow/following system

-- Drop functions first
DROP FUNCTION IF EXISTS get_user_follower_count(UUID);
DROP FUNCTION IF EXISTS get_user_following_count(UUID);
DROP FUNCTION IF EXISTS get_mosque_following_count(UUID);

-- Drop tables (this will also drop all associated indexes and constraints)
DROP TABLE IF EXISTS public.mosque_user_followers;
DROP TABLE IF EXISTS public.user_followers;
DROP TABLE IF EXISTS public.mosque_followers;

-- Note: RLS policies are automatically dropped when tables are dropped
