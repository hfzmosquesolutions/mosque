-- Check for approved applications that don't have corresponding memberships
-- This will help identify if the issue is in the approval process

SELECT 
    'Approved applications without memberships' as check_type,
    COUNT(*) as count
FROM kariah_applications ka
WHERE ka.status = 'approved'
    AND NOT EXISTS (
        SELECT 1 
        FROM kariah_memberships km 
        WHERE km.user_id = ka.user_id 
        AND km.mosque_id = ka.mosque_id
    )

UNION ALL

SELECT 
    'Total approved applications' as check_type,
    COUNT(*) as count
FROM kariah_applications
WHERE status = 'approved'

UNION ALL

SELECT 
    'Total memberships' as check_type,
    COUNT(*) as count
FROM kariah_memberships

UNION ALL

SELECT 
    'Total applications' as check_type,
    COUNT(*) as count
FROM kariah_applications;

-- Also show details of approved applications
SELECT 
    ka.id as application_id,
    ka.user_id,
    ka.mosque_id,
    ka.status,
    ka.reviewed_at,
    ka.created_at,
    CASE 
        WHEN km.id IS NOT NULL THEN 'Has Membership'
        ELSE 'No Membership'
    END as membership_status
FROM kariah_applications ka
LEFT JOIN kariah_memberships km ON km.user_id = ka.user_id AND km.mosque_id = ka.mosque_id
WHERE ka.status = 'approved'
ORDER BY ka.reviewed_at DESC;