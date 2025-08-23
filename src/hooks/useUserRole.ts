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

  useEffect(() => {
    async function fetchUserRole() {
      if (!user?.id) {
        setLoading(false);
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
          .single();

        if (profileError) {
          console.error('[HOOK] useUserRole - Profile fetch error:', profileError);
          throw profileError;
        }

        setProfile(profileData);

        // Check if user owns a mosque
        const { data: mosqueData, error: mosqueError } = await supabase
          .from('mosques')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (mosqueError) {
          console.log('[HOOK] useUserRole - Mosque ownership check error (user may not own a mosque):', mosqueError);
        }
        
        if (mosqueData && !mosqueError) {
          setIsMosqueOwner(true);
          setIsAdmin(true);
          setMosqueId(mosqueData.id);
        } else {
          console.log('[HOOK] useUserRole - User does not own a mosque');
        }
      } catch (err) {
        console.error('[HOOK] useUserRole - Error fetching user role:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user role');
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [user?.id]);

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