"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Custom hook for handling authentication-based redirects
 * @param options Configuration options for the redirect behavior
 */
export function useAuthRedirect(options: {
  /** Redirect authenticated users to this path */
  authenticatedRedirect?: string;
  /** Redirect unauthenticated users to this path */
  unauthenticatedRedirect?: string;
  /** Whether to require authentication (default: true) */
  requireAuth?: boolean;
}) {
  const {
    authenticatedRedirect = '/dashboard',
    unauthenticatedRedirect = '/login',
    requireAuth = true
  } = options;
  
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        router.push(unauthenticatedRedirect);
      } else if (!requireAuth && user) {
        router.push(authenticatedRedirect);
      }
    }
  }, [user, loading, router, authenticatedRedirect, unauthenticatedRedirect, requireAuth]);

  return { user, loading, isAuthenticated: !!user };
}

/**
 * Hook for pages that require authentication
 */
export function useRequireAuth(redirectTo = '/login') {
  return useAuthRedirect({
    requireAuth: true,
    unauthenticatedRedirect: redirectTo
  });
}

/**
 * Hook for pages that should redirect authenticated users (like login/signup)
 */
export function useRedirectIfAuthenticated(redirectTo = '/dashboard') {
  return useAuthRedirect({
    requireAuth: false,
    authenticatedRedirect: redirectTo
  });
}