-- Migration: Drop mosque-linked subscription tables (irreversible)
BEGIN;

-- Optional safety checks (commented out). Uncomment to prevent accidental drops.
-- DO $$ BEGIN
--   IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='mosque_subscriptions') THEN
--     IF (SELECT COUNT(*) FROM public.mosque_subscriptions) > 0 THEN
--       RAISE EXCEPTION 'mosque_subscriptions not empty; aborting drop';
--     END IF;
--   END IF;
-- END $$;

DROP TABLE IF EXISTS public.subscription_invoices;
DROP TABLE IF EXISTS public.mosque_subscriptions;

COMMIT;


