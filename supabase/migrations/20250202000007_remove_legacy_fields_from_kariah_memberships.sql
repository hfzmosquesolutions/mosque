-- Remove legacy record fields from kariah_memberships table
-- These fields are not needed as legacy records are handled separately in legacy_khairat_records table

-- Drop the function that updates legacy stats
DROP FUNCTION IF EXISTS update_membership_legacy_stats(uuid);

-- Remove legacy-related columns from kariah_memberships table
ALTER TABLE public.kariah_memberships 
DROP COLUMN IF EXISTS legacy_records_count,
DROP COLUMN IF EXISTS total_legacy_amount;

-- Add comment to clarify the separation of concerns
COMMENT ON TABLE public.kariah_memberships IS 'Kariah membership records. Legacy records are handled separately in legacy_khairat_records table.';