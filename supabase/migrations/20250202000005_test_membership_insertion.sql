-- Test membership insertion to identify any constraint issues
-- This migration will attempt to insert a test record and then remove it

-- First, let's check if we have any user_profiles and mosques to reference
DO $$
DECLARE
    test_user_id UUID;
    test_mosque_id UUID;
    membership_id UUID;
BEGIN
    -- Get the first user_id from user_profiles
    SELECT id INTO test_user_id FROM user_profiles LIMIT 1;
    
    -- Get the first mosque_id from mosques
    SELECT id INTO test_mosque_id FROM mosques LIMIT 1;
    
    -- Check if we have both user and mosque
    IF test_user_id IS NOT NULL AND test_mosque_id IS NOT NULL THEN
        RAISE NOTICE 'Found test user: % and mosque: %', test_user_id, test_mosque_id;
        
        -- Try to insert a test membership
        INSERT INTO kariah_memberships (
            user_id,
            mosque_id,
            status,
            joined_date,
            notes
        ) VALUES (
            test_user_id,
            test_mosque_id,
            'active',
            CURRENT_DATE,
            'Test membership - will be deleted'
        ) RETURNING id INTO membership_id;
        
        RAISE NOTICE 'Successfully inserted test membership with ID: %', membership_id;
        
        -- Clean up - delete the test record
        DELETE FROM kariah_memberships WHERE id = membership_id;
        
        RAISE NOTICE 'Test membership deleted successfully';
    ELSE
        RAISE NOTICE 'Missing test data - user_id: %, mosque_id: %', test_user_id, test_mosque_id;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during test insertion: %', SQLERRM;
END $$;

-- Also check current counts
SELECT 
    'user_profiles' as table_name, 
    COUNT(*) as count 
FROM user_profiles
UNION ALL
SELECT 
    'mosques' as table_name, 
    COUNT(*) as count 
FROM mosques
UNION ALL
SELECT 
    'kariah_memberships' as table_name, 
    COUNT(*) as count 
FROM kariah_memberships
UNION ALL
SELECT 
    'kariah_applications' as table_name, 
    COUNT(*) as count 
FROM kariah_applications;