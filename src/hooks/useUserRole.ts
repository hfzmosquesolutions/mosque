'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types/database';

interface UserRoleData {
  profile: UserProfile | null;
  isAdmin: boolean;
  isMosqueOwner: boolean;
  mosqueId: string | null;
  loading: boolean;
  error: string | null;
}

export function useUserRole(): UserRoleData {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMosqueOwner, setIsMosqueOwner] = useState(false);
  const [mosqueId, setMosqueId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Listen for custom event to refresh admin status (triggered after onboarding)
  useEffect(() => {
    const handleRefresh = () => {
      console.log('[HOOK] useUserRole - Refresh triggered');
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('refreshUserRole', handleRefresh);
    return () => window.removeEventListener('refreshUserRole', handleRefresh);
  }, []);

  useEffect(() => {
    async function fetchUserRole() {
      if (!user?.id) {
        setLoading(false);
        setIsAdmin(false);
        setIsMosqueOwner(false);
        setMosqueId(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          // Profile doesn't exist yet - user needs to complete onboarding
          console.log('[HOOK] useUserRole - Profile not found, user needs onboarding:', profileError);
          setProfile(null);
        } else {
          setProfile(profileData);
        }

        // Check if user owns a mosque
        // Use maybeSingle() instead of single() to handle "no rows" case gracefully
        const { data: mosqueData, error: mosqueError } = await supabase
          .from('mosques')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (mosqueError) {
          // Log the error for debugging
          console.log('[HOOK] useUserRole - Mosque query result:', {
            error: mosqueError,
            code: mosqueError.code,
            message: mosqueError.message,
            userId: user.id
          });
          
          // PGRST116 is "no rows returned" which is fine
          // Other errors might be RLS issues or real problems
          if (mosqueError.code !== 'PGRST116') {
            console.error('[HOOK] useUserRole - Mosque ownership check error:', mosqueError);
          }
        }
        
        // Determine admin status: user is admin if they own a mosque OR if their account_type is 'admin'
        const isAdminByAccountType = profileData?.account_type === 'admin';
        const isAdminByMosque = !!mosqueData;
        const isAdmin = isAdminByAccountType || isAdminByMosque;
        
        if (mosqueData) {
          setIsMosqueOwner(true);
          setIsAdmin(true);
          setMosqueId(mosqueData.id);
          console.log('[HOOK] useUserRole - ✅ User is admin, owns mosque:', mosqueData.id);
        } else if (isAdminByAccountType) {
          // User is admin by account_type but doesn't own a mosque yet (skipped mosque registration)
          setIsMosqueOwner(false);
          setIsAdmin(true);
          setMosqueId(null);
          console.log('[HOOK] useUserRole - ✅ User is admin (account_type=admin) but no mosque yet (userId:', user.id + ')');
        } else {
          setIsMosqueOwner(false);
          setIsAdmin(false);
          setMosqueId(null);
          console.log('[HOOK] useUserRole - ❌ User is not admin (userId:', user.id + ')');
        }
      } catch (err) {
        console.error('[HOOK] useUserRole - Error fetching user role:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user role');
        setIsAdmin(false);
        setIsMosqueOwner(false);
        setMosqueId(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [user?.id, refreshTrigger]);

  return {
    profile,
    isAdmin,
    isMosqueOwner,
    mosqueId,
    loading,
    error,
  };
}

// Helper hook to check if user has access to admin features
export function useAdminAccess() {
  const { isAdmin, loading } = useUserRole();
  return { hasAdminAccess: isAdmin, loading };
}

// Helper hook to get user's mosque ID
export function useUserMosque() {
  const { mosqueId, loading, error } = useUserRole();
  return { mosqueId, loading, error };
}