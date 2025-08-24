-- Update RLS policies for proper admin authorization using mosque.user_id
-- This migration ensures that admin checks use the correct relationship between users and mosques

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own legacy records" ON legacy_khairat_records;
DROP POLICY IF EXISTS "Users can view their matched legacy records" ON legacy_khairat_records;
DROP POLICY IF EXISTS "Mosque admins can view all legacy records" ON legacy_khairat_records;
DROP POLICY IF EXISTS "Mosque admins can insert legacy records" ON legacy_khairat_records;
DROP POLICY IF EXISTS "Mosque admins can update legacy records" ON legacy_khairat_records;
DROP POLICY IF EXISTS "Mosque admins can delete legacy records" ON legacy_khairat_records;

DROP POLICY IF EXISTS "Users can view their own applications" ON kariah_applications;
DROP POLICY IF EXISTS "Mosque admins can view all applications" ON kariah_applications;
DROP POLICY IF EXISTS "Users can insert their own applications" ON kariah_applications;
DROP POLICY IF EXISTS "Mosque admins can update applications" ON kariah_applications;
DROP POLICY IF EXISTS "Mosque admins can delete applications" ON kariah_applications;

DROP POLICY IF EXISTS "Users can view their own memberships" ON kariah_memberships;
DROP POLICY IF EXISTS "Mosque admins can view all memberships" ON kariah_memberships;
DROP POLICY IF EXISTS "Mosque admins can insert memberships" ON kariah_memberships;
DROP POLICY IF EXISTS "Mosque admins can update memberships" ON kariah_memberships;
DROP POLICY IF EXISTS "Mosque admins can delete memberships" ON kariah_memberships;

-- =============================================
-- LEGACY KHAIRAT RECORDS POLICIES
-- =============================================

-- Users can view legacy records that are matched to them
CREATE POLICY "Users can view their matched legacy records" ON legacy_khairat_records
    FOR SELECT
    USING (auth.uid() = matched_user_id);

-- Mosque admins can view all legacy records for their mosque
CREATE POLICY "Mosque admins can view all legacy records" ON legacy_khairat_records
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM mosques 
            WHERE mosques.id = legacy_khairat_records.mosque_id 
            AND mosques.user_id = auth.uid()
        )
    );

-- Mosque admins can insert legacy records for their mosque
CREATE POLICY "Mosque admins can insert legacy records" ON legacy_khairat_records
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM mosques 
            WHERE mosques.id = legacy_khairat_records.mosque_id 
            AND mosques.user_id = auth.uid()
        )
    );

-- Mosque admins can update legacy records for their mosque
CREATE POLICY "Mosque admins can update legacy records" ON legacy_khairat_records
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM mosques 
            WHERE mosques.id = legacy_khairat_records.mosque_id 
            AND mosques.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM mosques 
            WHERE mosques.id = legacy_khairat_records.mosque_id 
            AND mosques.user_id = auth.uid()
        )
    );

-- Mosque admins can delete legacy records for their mosque
CREATE POLICY "Mosque admins can delete legacy records" ON legacy_khairat_records
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM mosques 
            WHERE mosques.id = legacy_khairat_records.mosque_id 
            AND mosques.user_id = auth.uid()
        )
    );

-- =============================================
-- KARIAH APPLICATIONS POLICIES
-- =============================================

-- Users can view their own applications
CREATE POLICY "Users can view their own applications" ON kariah_applications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Mosque admins can view all applications for their mosque
CREATE POLICY "Mosque admins can view all applications" ON kariah_applications
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM mosques 
            WHERE mosques.id = kariah_applications.mosque_id 
            AND mosques.user_id = auth.uid()
        )
    );

-- Users can insert their own applications
CREATE POLICY "Users can insert their own applications" ON kariah_applications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Mosque admins can update applications for their mosque
CREATE POLICY "Mosque admins can update applications" ON kariah_applications
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM mosques 
            WHERE mosques.id = kariah_applications.mosque_id 
            AND mosques.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM mosques 
            WHERE mosques.id = kariah_applications.mosque_id 
            AND mosques.user_id = auth.uid()
        )
    );

-- Mosque admins can delete applications for their mosque
CREATE POLICY "Mosque admins can delete applications" ON kariah_applications
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM mosques 
            WHERE mosques.id = kariah_applications.mosque_id 
            AND mosques.user_id = auth.uid()
        )
    );

-- =============================================
-- KARIAH MEMBERSHIPS POLICIES
-- =============================================

-- Users can view their own memberships
CREATE POLICY "Users can view their own memberships" ON kariah_memberships
    FOR SELECT
    USING (auth.uid() = user_id);

-- Mosque admins can view all memberships for their mosque
CREATE POLICY "Mosque admins can view all memberships" ON kariah_memberships
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM mosques 
            WHERE mosques.id = kariah_memberships.mosque_id 
            AND mosques.user_id = auth.uid()
        )
    );

-- Mosque admins can insert memberships for their mosque
CREATE POLICY "Mosque admins can insert memberships" ON kariah_memberships
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM mosques 
            WHERE mosques.id = kariah_memberships.mosque_id 
            AND mosques.user_id = auth.uid()
        )
    );

-- Mosque admins can update memberships for their mosque
CREATE POLICY "Mosque admins can update memberships" ON kariah_memberships
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM mosques 
            WHERE mosques.id = kariah_memberships.mosque_id 
            AND mosques.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM mosques 
            WHERE mosques.id = kariah_memberships.mosque_id 
            AND mosques.user_id = auth.uid()
        )
    );

-- Mosque admins can delete memberships for their mosque
CREATE POLICY "Mosque admins can delete memberships" ON kariah_memberships
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM mosques 
            WHERE mosques.id = kariah_memberships.mosque_id 
            AND mosques.user_id = auth.uid()
        )
    );

-- Grant necessary permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON legacy_khairat_records TO authenticated;
GRANT SELECT ON legacy_khairat_records TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON kariah_applications TO authenticated;
GRANT SELECT ON kariah_applications TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON kariah_memberships TO authenticated;
GRANT SELECT ON kariah_memberships TO anon;

-- Ensure mosques table has proper permissions for the joins
GRANT SELECT ON mosques TO authenticated;
GRANT SELECT ON mosques TO anon;