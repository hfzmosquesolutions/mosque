-- Create organization_people table for mosque staff, board members, volunteers, etc.
-- This is for informational purposes only, not for user accounts

CREATE TABLE organization_people (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mosque_id UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL, -- e.g., "Imam", "Board Member", "Volunteer", "Treasurer"
    department VARCHAR(255), -- e.g., "Administration", "Finance", "Events", "Education"
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    bio TEXT,
    profile_picture_url TEXT,
    is_public BOOLEAN DEFAULT true, -- Whether to show in public mosque profile
    is_active BOOLEAN DEFAULT true,
    start_date DATE,
    end_date DATE, -- For temporary positions
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_organization_people_mosque_id ON organization_people(mosque_id);
CREATE INDEX idx_organization_people_position ON organization_people(position);
CREATE INDEX idx_organization_people_is_active ON organization_people(is_active);
CREATE INDEX idx_organization_people_is_public ON organization_people(is_public);

-- Enable RLS
ALTER TABLE organization_people ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Mosque admins can view all organization people in their mosque
CREATE POLICY "Mosque admins can view organization people" ON organization_people
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM mosques 
            WHERE mosques.id = organization_people.mosque_id 
            AND mosques.user_id = auth.uid()
        )
    );

-- Mosque admins can insert organization people for their mosque
CREATE POLICY "Mosque admins can insert organization people" ON organization_people
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM mosques 
            WHERE mosques.id = organization_people.mosque_id 
            AND mosques.user_id = auth.uid()
        )
    );

-- Mosque admins can update organization people for their mosque
CREATE POLICY "Mosque admins can update organization people" ON organization_people
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM mosques 
            WHERE mosques.id = organization_people.mosque_id 
            AND mosques.user_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM mosques 
            WHERE mosques.id = organization_people.mosque_id 
            AND mosques.user_id = auth.uid()
        )
    );

-- Mosque admins can delete organization people for their mosque
CREATE POLICY "Mosque admins can delete organization people" ON organization_people
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM mosques 
            WHERE mosques.id = organization_people.mosque_id 
            AND mosques.user_id = auth.uid()
        )
    );

-- Public can view public organization people
CREATE POLICY "Public can view public organization people" ON organization_people
    FOR SELECT USING (is_public = true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON organization_people TO authenticated;
GRANT SELECT ON organization_people TO anon;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_organization_people_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_organization_people_updated_at
    BEFORE UPDATE ON organization_people
    FOR EACH ROW
    EXECUTE FUNCTION update_organization_people_updated_at();
