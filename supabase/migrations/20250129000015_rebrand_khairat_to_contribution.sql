-- Migration: Rebrand khairat to contribution
-- This migration renames khairat tables and related objects to contribution terminology

-- Rename tables
ALTER TABLE khairat_programs RENAME TO contribution_programs;
ALTER TABLE khairat_contributions RENAME TO contributions;

-- Rename indexes
ALTER INDEX idx_khairat_contributions_program_id RENAME TO idx_contributions_program_id;
ALTER INDEX idx_khairat_contributions_contributor_id RENAME TO idx_contributions_contributor_id;

-- Rename foreign key constraints
ALTER TABLE contributions RENAME CONSTRAINT khairat_contributions_pkey TO contributions_pkey;
ALTER TABLE contributions RENAME CONSTRAINT khairat_contributions_program_id_fkey TO contributions_program_id_fkey;

-- Rename primary key constraint for contribution_programs
ALTER TABLE contribution_programs RENAME CONSTRAINT khairat_programs_pkey TO contribution_programs_pkey;
ALTER TABLE contribution_programs RENAME CONSTRAINT khairat_programs_mosque_id_fkey TO contribution_programs_mosque_id_fkey;
ALTER TABLE contribution_programs RENAME CONSTRAINT khairat_programs_created_by_fkey TO contribution_programs_created_by_fkey;

-- Update the trigger function name and references
DROP TRIGGER IF EXISTS khairat_contribution_amount_trigger ON contributions;

-- Check if the old function exists and rename it, otherwise create the new function
DO $$
BEGIN
    -- Try to rename the function if it exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_khairat_program_amount') THEN
        ALTER FUNCTION update_khairat_program_amount() RENAME TO update_contribution_program_amount;
    END IF;
END $$;

-- Create or replace the function with updated table names
CREATE OR REPLACE FUNCTION update_contribution_program_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE contribution_programs 
        SET current_amount = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM contributions 
            WHERE program_id = NEW.program_id 
            AND status = 'completed'
        )
        WHERE id = NEW.program_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE contribution_programs 
        SET current_amount = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM contributions 
            WHERE program_id = OLD.program_id 
            AND status = 'completed'
        )
        WHERE id = OLD.program_id;
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger with new name
CREATE TRIGGER contribution_amount_trigger
    AFTER INSERT OR UPDATE OR DELETE ON contributions
    FOR EACH ROW EXECUTE FUNCTION update_contribution_program_amount();

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the updated_at trigger for contribution_programs
DROP TRIGGER IF EXISTS update_contribution_programs_updated_at ON contribution_programs;
CREATE TRIGGER update_contribution_programs_updated_at 
    BEFORE UPDATE ON contribution_programs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Rename the enum type
ALTER TYPE khairat_status RENAME TO contribution_status;

-- Update table name references in database.ts TableName type
-- Note: This will be handled in the TypeScript code separately

-- Add comments for clarity
COMMENT ON TABLE contribution_programs IS 'Programs for community welfare contributions (formerly khairat_programs)';
COMMENT ON TABLE contributions IS 'Individual contributions to welfare programs (formerly khairat_contributions)';