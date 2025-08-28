-- Add contribution_id column to legacy_khairat_records table
-- This column will store the ID of the contribution record created when matching a legacy record

ALTER TABLE legacy_khairat_records 
ADD COLUMN contribution_id UUID REFERENCES contributions(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_legacy_khairat_records_contribution_id ON legacy_khairat_records(contribution_id);

-- Add comment to document the purpose of this column
COMMENT ON COLUMN legacy_khairat_records.contribution_id IS 'References the contribution record created when this legacy record is matched to a user';