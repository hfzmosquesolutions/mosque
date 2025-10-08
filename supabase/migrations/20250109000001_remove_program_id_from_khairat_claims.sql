-- Migration: Remove program_id from khairat_claims table
-- Khairat claims are general assistance requests and don't need to be tied to specific programs

-- Step 1: Drop the foreign key constraint
ALTER TABLE public.khairat_claims DROP CONSTRAINT IF EXISTS khairat_claims_program_id_fkey;

-- Step 2: Drop the index on program_id
DROP INDEX IF EXISTS idx_khairat_claims_program_id;

-- Step 3: Remove the program_id column
ALTER TABLE public.khairat_claims DROP COLUMN IF EXISTS program_id;

-- Step 4: Update table comment
COMMENT ON TABLE public.khairat_claims IS 'General khairat assistance claims submitted by users - not tied to specific programs';

-- Migration completed successfully
-- Khairat claims are now independent of specific programs
