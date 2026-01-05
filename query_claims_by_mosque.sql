-- Simple SQL query to get all claims for a specific mosque
-- Replace 'YOUR_MOSQUE_ID_HERE' with your actual mosque ID

-- Option 1: Get all claims with all related data
SELECT 
  kc.*,
  km.full_name as member_name,
  km.phone as member_phone,
  km.ic_passport_number as member_ic,
  km.membership_number,
  km.status as member_status,
  m.name as mosque_name,
  up_claimant.full_name as claimant_name,
  up_reviewer.full_name as reviewer_name,
  up_approver.full_name as approver_name
FROM khairat_claims kc
LEFT JOIN khairat_members km ON km.id = kc.khairat_member_id
LEFT JOIN mosques m ON m.id = kc.mosque_id
LEFT JOIN user_profiles up_claimant ON up_claimant.id = kc.claimant_id
LEFT JOIN user_profiles up_reviewer ON up_reviewer.id = kc.reviewed_by
LEFT JOIN user_profiles up_approver ON up_approver.id = kc.approved_by
WHERE kc.mosque_id = 'YOUR_MOSQUE_ID_HERE'  -- Replace with your mosque ID
ORDER BY kc.created_at DESC;

-- Option 2: Simple count and basic info
SELECT 
  COUNT(*) as total_claims,
  COUNT(CASE WHEN kc.status = 'pending' THEN 1 END) as pending_claims,
  COUNT(CASE WHEN kc.status = 'approved' THEN 1 END) as approved_claims,
  COUNT(CASE WHEN kc.status = 'rejected' THEN 1 END) as rejected_claims,
  COUNT(CASE WHEN kc.claimant_id IS NULL THEN 1 END) as anonymous_claims
FROM khairat_claims kc
WHERE kc.mosque_id = 'YOUR_MOSQUE_ID_HERE';  -- Replace with your mosque ID

-- Option 3: Get all mosque IDs to find yours
SELECT id, name, created_at 
FROM mosques 
ORDER BY created_at DESC;

-- Option 4: Get claims with member details (most useful)
SELECT 
  kc.id as claim_id,
  kc.title,
  kc.status,
  kc.priority,
  kc.requested_amount,
  kc.approved_amount,
  kc.created_at,
  km.full_name as member_name,
  km.membership_number,
  km.ic_passport_number,
  m.name as mosque_name,
  CASE 
    WHEN kc.claimant_id IS NULL THEN 'Anonymous'
    ELSE up_claimant.full_name
  END as submitted_by
FROM khairat_claims kc
INNER JOIN khairat_members km ON km.id = kc.khairat_member_id
INNER JOIN mosques m ON m.id = kc.mosque_id
LEFT JOIN user_profiles up_claimant ON up_claimant.id = kc.claimant_id
WHERE kc.mosque_id = 'YOUR_MOSQUE_ID_HERE'  -- Replace with your mosque ID
ORDER BY kc.created_at DESC;

