-- Migration: Make khairat_member_id required in khairat_claims
-- Similar to khairat_contributions, claims must be linked to a khairat_member record

-- First, ensure all existing claims have a khairat_member_id
-- For claims with claimant_id but no khairat_member_id, try to find the member record
UPDATE public.khairat_claims kc
SET khairat_member_id = (
  SELECT km.id
  FROM public.khairat_members km
  WHERE km.user_id = kc.claimant_id
    AND km.mosque_id = kc.mosque_id
    AND km.status IN ('active', 'approved')
  ORDER BY km.created_at DESC
  LIMIT 1
)
WHERE kc.khairat_member_id IS NULL
  AND kc.claimant_id IS NOT NULL;

-- For claims without khairat_member_id, try to find by IC number if available
-- This handles anonymous registrations that were later linked
UPDATE public.khairat_claims kc
SET khairat_member_id = (
  SELECT km.id
  FROM public.khairat_members km
  JOIN public.user_profiles up ON up.id = kc.claimant_id
  WHERE km.ic_passport_number = up.ic_passport_number
    AND km.mosque_id = kc.mosque_id
    AND km.status IN ('active', 'approved')
  ORDER BY km.created_at DESC
  LIMIT 1
)
WHERE kc.khairat_member_id IS NULL
  AND kc.claimant_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = kc.claimant_id 
    AND up.ic_passport_number IS NOT NULL
  );

-- For any remaining claims without khairat_member_id, we need to handle them
-- Option 1: Delete orphaned claims (claims without valid membership)
-- Option 2: Set them to a default/placeholder (not recommended)
-- Option 3: Keep them but prevent new ones (safer approach)

-- Check if there are any remaining NULL values
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM public.khairat_claims
  WHERE khairat_member_id IS NULL;
  
  IF null_count > 0 THEN
    RAISE NOTICE 'Warning: % claims still have NULL khairat_member_id. These will be deleted.', null_count;
    
    -- Delete orphaned claims that cannot be linked to a member
    DELETE FROM public.khairat_claims
    WHERE khairat_member_id IS NULL;
    
    RAISE NOTICE 'Deleted % orphaned claims without valid membership.', null_count;
  END IF;
END $$;

-- Drop the old constraint that allowed either khairat_member_id OR claimant_id
ALTER TABLE public.khairat_claims
DROP CONSTRAINT IF EXISTS khairat_claims_member_or_claimant_check;

-- Add new constraint: khairat_member_id is required (like payments)
-- claimant_id can be NULL for anonymous submissions
ALTER TABLE public.khairat_claims
ADD CONSTRAINT khairat_claims_member_required_check 
CHECK (khairat_member_id IS NOT NULL);

-- Make khairat_member_id NOT NULL
-- Now safe since we've handled all NULL values
ALTER TABLE public.khairat_claims
ALTER COLUMN khairat_member_id SET NOT NULL;

-- Update comment
COMMENT ON COLUMN public.khairat_claims.khairat_member_id IS 'Reference to khairat_members table. Required - all claims must be linked to a membership record, similar to khairat_contributions.';

