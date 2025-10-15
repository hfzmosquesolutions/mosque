-- Migration: Drop announcements feature (table, policies, enum)
-- Date: 2025-10-15

-- 1) Drop announcements table (cascades policies, indexes, FKs)
DROP TABLE IF EXISTS public.announcements CASCADE;

-- 2) Drop announcement_priority enum if present
DROP TYPE IF EXISTS public.announcement_priority;


