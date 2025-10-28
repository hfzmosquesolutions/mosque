'use client';

import { useState, useEffect } from 'react';
import { getMosqueSubscription, getUserSubscription, isFeatureAvailable } from '@/lib/subscription';
import { MosqueSubscription, UserSubscription } from '@/lib/subscription';
import { SubscriptionPlan } from '@/lib/stripe';

export function useSubscription(mosqueId: string) {
  const [subscription, setSubscription] = useState<MosqueSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!mosqueId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const subData = await getMosqueSubscription(mosqueId);
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

