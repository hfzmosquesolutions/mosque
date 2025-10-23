-- Add unique constraint to prevent duplicate kariah records for the same user and mosque
-- First, remove any existing duplicates, keeping the most recent one
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.constraint_column_usage
    WHERE table_name = 'kariah_members'
    AND constraint_name = 'kariah_members_user_mosque_unique'
  ) THEN
    -- Constraint already exists, do nothing
    NULL;
  ELSE
    -- Delete duplicate records, keeping the latest one
    DELETE FROM public.kariah_members
    WHERE id IN (
      SELECT id
      FROM (
        SELECT
          id,
          ROW_NUMBER() OVER (PARTITION BY user_id, mosque_id ORDER BY created_at DESC) as rn
        FROM public.kariah_members
      ) AS sub
      WHERE sub.rn > 1
    );

    -- Add the unique constraint
    ALTER TABLE public.kariah_members
    ADD CONSTRAINT kariah_members_user_mosque_unique UNIQUE (user_id, mosque_id);
  END IF;
END $$;

-- Add an index for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_kariah_members_user_mosque ON public.kariah_members (user_id, mosque_id);
