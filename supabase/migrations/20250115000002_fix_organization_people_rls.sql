-- Fix RLS policies for organization_people table
-- Drop existing policies
DROP POLICY IF EXISTS "Mosque admins can view organization people" ON organization_people;
DROP POLICY IF EXISTS "Mosque admins can insert organization people" ON organization_people;
DROP POLICY IF EXISTS "Mosque admins can update organization people" ON organization_people;
DROP POLICY IF EXISTS "Mosque admins can delete organization people" ON organization_people;
DROP POLICY IF EXISTS "Public can view public organization people" ON organization_people;

-- Create new, more permissive policies
-- Allow mosque owners to manage organization people
CREATE POLICY "Mosque owners can manage organization people" ON organization_people
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM mosques 
            WHERE mosques.id = organization_people.mosque_id 
            AND mosques.user_id = auth.uid()
        )
    );

-- Allow public to view public organization people
CREATE POLICY "Public can view public organization people" ON organization_people
    FOR SELECT USING (is_public = true);

-- Allow authenticated users to view organization people for their mosque
CREATE POLICY "Users can view organization people for their mosque" ON organization_people
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.mosque_id = organization_people.mosque_id
        )
    );
