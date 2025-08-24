-- Check current RLS policies for kariah_memberships
-- This migration will also ensure proper permissions are granted

-- First, let's check if there are any existing policies
-- SELECT * FROM pg_policies WHERE tablename = 'kariah_memberships';

-- Grant basic permissions to anon and authenticated roles
GRANT SELECT ON kariah_memberships TO anon;
GRANT ALL PRIVILEGES ON kariah_memberships TO authenticated;

-- Create RLS policies if they don't exist
-- Policy for authenticated users to see memberships from their mosque
DO $$
BEGIN
    -- Check if policy exists before creating
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'kariah_memberships' 
        AND policyname = 'Users can view memberships from their mosque'
    ) THEN
        CREATE POLICY "Users can view memberships from their mosque" ON kariah_memberships
            FOR SELECT USING (
                mosque_id IN (
                    SELECT mosque_id FROM user_profiles 
                    WHERE id = auth.uid()
                )
            );
    END IF;
END $$;

-- Policy for authenticated users to insert memberships (for admin operations)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'kariah_memberships' 
        AND policyname = 'Authenticated users can insert memberships'
    ) THEN
        CREATE POLICY "Authenticated users can insert memberships" ON kariah_memberships
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

-- Policy for authenticated users to update memberships
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'kariah_memberships' 
        AND policyname = 'Authenticated users can update memberships'
    ) THEN
        CREATE POLICY "Authenticated users can update memberships" ON kariah_memberships
            FOR UPDATE USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Policy for authenticated users to delete memberships
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'kariah_memberships' 
        AND policyname = 'Authenticated users can delete memberships'
    ) THEN
        CREATE POLICY "Authenticated users can delete memberships" ON kariah_memberships
            FOR DELETE USING (auth.role() = 'authenticated');
    END IF;
END $$;