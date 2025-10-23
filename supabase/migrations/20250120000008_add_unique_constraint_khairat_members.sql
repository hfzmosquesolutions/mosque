-- Add unique constraint to prevent duplicate khairat members per user per mosque
-- This ensures that a user can only have one active record per mosque

-- First, let's clean up any existing duplicates by keeping only the latest record per user per mosque
WITH ranked_members AS (
  SELECT 
    id,
    user_id,
    mosque_id,
    status,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, mosque_id 
      ORDER BY created_at DESC
    ) as rn
  FROM khairat_members
),
duplicates_to_delete AS (
  SELECT id 
  FROM ranked_members 
  WHERE rn > 1
)
DELETE FROM khairat_members 
WHERE id IN (SELECT id FROM duplicates_to_delete);

-- Add unique constraint to prevent future duplicates
-- This constraint allows only one record per user per mosque
ALTER TABLE khairat_members 
ADD CONSTRAINT khairat_members_user_mosque_unique 
UNIQUE (user_id, mosque_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_khairat_members_user_mosque 
ON khairat_members (user_id, mosque_id);
