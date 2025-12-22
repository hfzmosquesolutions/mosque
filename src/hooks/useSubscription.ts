'use client';

import { useState, useEffect } from 'react';
import { getMosqueSubscription, getUserSubscription, isFeatureAvailable } from '@/lib/subscription';
import { MosqueSubscription, UserSubscription } from '@/lib/subscription';
import { SubscriptionPlan } from '@/lib/stripe';
import { useUserRole } from './useUserRole';
import { createClient } from '@/lib/supabase';

export function useSubscription(mosqueId: string) {
  const [subscription, setSubscription] = useState<MosqueSubscription | UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // We need to know who the current user is to check for user-linked subscriptions
  // But we can't easily get the user ID inside this hook without adding a dependency
  // So we'll try to get it from supabase directly if possible, or assume it's passed via context/prop if we refactor further
  // For now, let's fetch the mosque owner's user ID if we don't have the current user ID
  
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!mosqueId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Strategy:
        // 1. Try to find the mosque owner
        // 2. Check if the mosque owner has a user_subscription
        // 3. If not, check if the mosque has a mosque_subscription (legacy)
        
        const supabase = createClient();
        
        // Get mosque owner ID
        const { data: mosqueData, error: mosqueError } = await supabase
          .from('mosques')
          .select('user_id')
          .eq('id', mosqueId)
          .single();
          
        let subData: MosqueSubscription | UserSubscription | null = null;
        
        if (mosqueData?.user_id) {
          // Check user subscription first (preferred)
          const userSub = await getUserSubscription(mosqueData.user_id);
          if (userSub && (userSub.status === 'active' || userSub.status === 'trialing')) {
            subData = userSub;
          }
        }
        
        // Fallback to mosque subscription if no active user subscription found
        if (!subData) {
          subData = await getMosqueSubscription(mosqueId);
        }
        
        setSubscription(subData);
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError('Failed to load subscription data');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [mosqueId]);

  const checkFeature = async (featureName: string): Promise<boolean> => {
    if (!mosqueId) return false;
    
    try {
      return await isFeatureAvailable(mosqueId, featureName);
    } catch (err) {
      console.error('Error checking feature availability:', err);
      return false;
    }
  };

  const isPremium = subscription?.plan === 'standard' || subscription?.plan === 'pro';
  const isEnterprise = subscription?.plan === 'pro';
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';

  return {
    subscription,
    loading,
    error,
    checkFeature,
    isPremium,
    isEnterprise,
    isActive,
    plan: subscription?.plan || 'free' as SubscriptionPlan
  };
}

