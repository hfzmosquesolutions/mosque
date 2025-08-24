-- Add ic_passport_number column to user_profiles table
-- This migration adds the IC/Passport number field to collect during user onboarding

ALTER TABLE user_profiles 
ADD COLUMN ic_passport_number TEXT;

-- Add comment to document the column purpose
COMMENT ON COLUMN user_profiles.ic_passport_number IS 'Identity Card or Passport number for user identification';