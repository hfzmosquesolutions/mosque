'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthState } from '@/hooks/useAuth.v2';
import { isProfileComplete } from '@/utils/profileUtils';

interface ProfileGuardProps {
  children: React.ReactNode;
}

export function ProfileGuard({ children }: ProfileGuardProps) {
  const { user, profile, isLoading } = useAuthState();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect if still loading
    if (isLoading) return;

    // Don't redirect if user is not authenticated
    if (!user) return;

    // Don't redirect if already on onboarding page
    if (pathname === '/onboarding') return;

    // Don't redirect if on auth pages or public pages
    if (
      pathname.startsWith('/login') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/auth/') ||
      pathname.startsWith('/public/') ||
      pathname === '/mosque'
    ) {
      return;
    }

    // Check if profile is complete
    if (user && !isProfileComplete(profile)) {
      // Allow access to account page to update profile
      if (pathname === '/account') return;

      router.push('/onboarding');
    }
  }, [user, profile, isLoading, router, pathname]);

  return <>{children}</>;
}
