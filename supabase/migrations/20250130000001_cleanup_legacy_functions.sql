-- Migration to clean up unused legacy functions and update existing ones
-- Remove references to deleted legacy_records_count and total_legacy_amount columns

-- Drop the unused find_legacy_matches function
DROP FUNCTION IF EXISTS find_legacy_matches(uuid, varchar(20));

-- Drop the unused match_legacy_records_to_user function
-- This function is no longer needed as legacy record matching is handled
-- automatically in the kariah application approval process
DROP FUNCTION IF EXISTS match_legacy_records_to_user(uuid, uuid, varchar(20));