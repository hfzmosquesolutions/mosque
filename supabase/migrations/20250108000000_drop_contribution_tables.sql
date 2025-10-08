-- Migration: Drop old contribution tables since we now use dedicated khairat tables
-- This migration removes the old contribution_programs and contributions tables
-- as they are no longer needed after migrating to khairat_programs and khairat_contributions

begin;

-- Drop triggers first
DROP TRIGGER IF EXISTS contribution_amount_trigger ON contributions;
DROP TRIGGER IF EXISTS update_contribution_programs_updated_at ON contribution_programs;

-- Drop functions
DROP FUNCTION IF EXISTS update_contribution_program_amount();

-- Drop indexes
DROP INDEX IF EXISTS idx_contributions_program_id;
DROP INDEX IF EXISTS idx_contributions_contributor_id;
DROP INDEX IF EXISTS idx_contributions_payment_data;
DROP INDEX IF EXISTS idx_contributions_bill_id;

-- Drop tables (order matters due to foreign key constraints)
DROP TABLE IF EXISTS contributions CASCADE;
DROP TABLE IF EXISTS contribution_programs CASCADE;

-- Drop the contribution_status enum if it's no longer used
-- (We'll keep it since khairat_contributions still uses it)
-- DROP TYPE IF EXISTS contribution_status;

-- Add comments for clarity
COMMENT ON TABLE khairat_programs IS 'Dedicated table for khairat (welfare) programs';
COMMENT ON TABLE khairat_contributions IS 'Dedicated table for khairat (welfare) contributions';

commit;
