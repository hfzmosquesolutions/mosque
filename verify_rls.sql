-- Verification script to check if RLS policies are properly applied
-- Run this in your Supabase SQL editor to verify RLS is working

-- Check if RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check all RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test basic functionality (should only return data for authenticated user's mosque)
-- Replace 'your-user-id' with actual user ID when testing
/*
SELECT 
    'mosques' as table_name,
    count(*) as accessible_records
FROM public.mosques
WHERE user_id = auth.uid()

UNION ALL

SELECT 
    'user_profiles' as table_name,
    count(*) as accessible_records
FROM public.user_profiles
WHERE id = auth.uid();
*/