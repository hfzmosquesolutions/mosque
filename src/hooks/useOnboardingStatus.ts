'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { checkOnboardingStatus } from '@/lib/api';

interface OnboardingStatus {
  isCompleted: boolean;
  isLoading: boolean;
}

export function useOnboardingStatus(): OnboardingStatus {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkOnboardingStatusAsync = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Check the user's onboarding status from the database
        const status = await checkOnboardingStatus(user.id);
        setIsCompleted(status);
      } catch (error) {
        console.error('[HOOK] useOnboardingStatus - Error checking onboarding status:', error);
        setIsCompleted(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatusAsync();
  }, [user]);

  return { isCompleted, isLoading };
}

export function useOnboardingRedirect() {
  const { user } = useAuth();
  const { isCompleted, isLoading } = useOnboardingStatus();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !isCompleted) {
      // Only redirect if we're not already on the onboarding page
      if (window.location.pathname !== '/onboarding') {
        router.push('/onboarding');
      }
    }
  }, [user, isCompleted, isLoading, router]);

  return { isCompleted, isLoading };
}
