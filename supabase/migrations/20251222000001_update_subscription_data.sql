-- Migration: Migrate subscription data to new enum values
-- Date: 2025-12-22
-- PART 2: Update the data using the new enum values.
-- This runs in a separate migration to avoid "unsafe use of new value" error.

BEGIN;

-- Map 'premium' -> 'standard'
UPDATE public.user_subscriptions 
SET plan = 'standard' 
WHERE plan = 'premium';

-- Map 'enterprise' -> 'pro'
UPDATE public.user_subscriptions 
SET plan = 'pro' 
WHERE plan = 'enterprise';

COMMIT;
