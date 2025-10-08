-- Migration: Remove claim history functionality to simplify the system
-- This migration removes the khairat_claim_history table and related triggers

-- Step 1: Drop the trigger that creates history entries
DROP TRIGGER IF EXISTS khairat_claims_history_trigger ON public.khairat_claims;

-- Step 2: Drop the function that creates history entries
DROP FUNCTION IF EXISTS create_claim_history_entry();

-- Step 3: Drop the khairat_claim_history table
DROP TABLE IF EXISTS public.khairat_claim_history;

-- Step 4: Remove any indexes related to claim history (if they exist)
DROP INDEX IF EXISTS idx_claim_history_claim_id;
DROP INDEX IF EXISTS idx_claim_history_performed_at;

-- Migration completed successfully
-- The claim history functionality has been removed to simplify the system
