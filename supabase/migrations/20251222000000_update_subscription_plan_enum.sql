-- Migration: Update subscription_plan enum to match application code (free, standard, pro)
-- Date: 2025-12-22
-- PART 1: Add the new enum values.
-- We must do this in a separate migration (or transaction) before we can use these values in UPDATE statements.

-- 1. Add new enum values if they don't exist
DO $$
BEGIN
  -- Add 'standard' if not present
  BEGIN
    ALTER TYPE subscription_plan ADD VALUE 'standard';
  EXCEPTION
    WHEN duplicate_object THEN null;
  END;

  -- Add 'pro' if not present
  BEGIN
    ALTER TYPE subscription_plan ADD VALUE 'pro';
  EXCEPTION
    WHEN duplicate_object THEN null;
  END;
END $$;
