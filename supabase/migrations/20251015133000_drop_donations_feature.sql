-- Migration: Drop donations feature (tables, RLS policies, enum)
-- Date: 2025-10-15

-- 1) Drop donation tables (will also drop dependent policies, indexes, FKs)
DROP TABLE IF EXISTS public.donations CASCADE;
DROP TABLE IF EXISTS public.donation_categories CASCADE;

-- 2) Drop donation enum type if present
DROP TYPE IF EXISTS public.donation_status;

-- 3) Safety: remove any lingering grants on dropped tables (no-op if tables gone)
DO $$
BEGIN
  IF to_regclass('public.donations') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON TABLE public.donations FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON TABLE public.donations FROM anon';
    EXECUTE 'REVOKE ALL ON TABLE public.donations FROM authenticated';
  END IF;

  IF to_regclass('public.donation_categories') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON TABLE public.donation_categories FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON TABLE public.donation_categories FROM anon';
    EXECUTE 'REVOKE ALL ON TABLE public.donation_categories FROM authenticated';
  END IF;
END $$;


