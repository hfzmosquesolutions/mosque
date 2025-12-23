'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/useUserRole';
import { Card, CardContent } from '@/components/ui/card';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
  requireAdmin?: boolean; // New prop: require admin access
}

export function ProtectedRoute({
  children,
  redirectTo = '/login',
  requireAuth = true,
  requireAdmin = true, // Default to requiring admin access
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { hasAdminAccess, loading: adminLoading } = useAdminAccess();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);

  useEffect(() => {
    // Don't do anything while still loading
    if (loading || adminLoading) {
      return;
    }

    if (requireAuth && !user) {
      // Redirect to login if not authenticated
      router.push(redirectTo);
      return;
    }

    if (requireAuth && requireAdmin && user && !hasAdminAccess && !isCheckingAdmin) {
      // Double-check admin status directly from database before redirecting
      // This handles the case where the hook hasn't updated yet
      setIsCheckingAdmin(true);
      const doubleCheckAdmin = async () => {
        try {
          const { supabase } = await import('@/lib/supabase');
          
          // Check if user owns a mosque (is admin)
          const { data: mosqueData, error: mosqueError } = await supabase
            .from('mosques')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          console.log('[ProtectedRoute] Double-checking admin status:', { 
            hasMosque: !!mosqueData, 
            error: mosqueError?.code,
            userId: user.id 
          });
          
          if (mosqueData) {
            // User IS admin, but hook hasn't updated yet
            // Trigger refresh and wait for it to update
            console.log('[ProtectedRoute] ✅ User is admin, triggering hook refresh...');
            window.dispatchEvent(new CustomEvent('refreshUserRole'));
            // Wait for hook to update (it will trigger a re-render)
            // Reset checking flag after a delay to allow hook to update
            setTimeout(() => {
              setIsCheckingAdmin(false);
            }, 1000);
            // Don't redirect - let the hook update and component re-render
            return;
          }
          
          // User doesn't own a mosque, check onboarding
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .maybeSingle();
          
          setIsCheckingAdmin(false);
          
          if (!profile || !profile.onboarding_completed) {
            // User hasn't completed onboarding, redirect to onboarding
            console.log('[ProtectedRoute] User needs onboarding, redirecting...');
            router.push('/onboarding');
            return;
          }
          
          // User completed onboarding but is not admin - redirect to home
          console.log('[ProtectedRoute] ❌ User is not admin, redirecting to home');
          router.push('/');
        } catch (error) {
          console.error('[ProtectedRoute] Error checking admin status:', error);
          setIsCheckingAdmin(false);
          // On error, redirect to onboarding to be safe
          router.push('/onboarding');
        }
      };
      
      doubleCheckAdmin();
      return; // Don't proceed until double-check completes
    }

    if (!requireAuth && user && hasAdminAccess) {
      // Redirect authenticated admin users away from auth pages
      const returnUrl = 
        (typeof window !== 'undefined' && sessionStorage.getItem('returnUrl')) ||
        searchParams.get('returnUrl') ||
        '/dashboard';
      
      if (typeof window !== 'undefined' && sessionStorage.getItem('returnUrl')) {
        sessionStorage.removeItem('returnUrl');
      }
      
      if (returnUrl && returnUrl !== '/dashboard') {
        window.location.href = returnUrl;
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, loading, adminLoading, hasAdminAccess, router, redirectTo, requireAuth, requireAdmin, searchParams]);

  // CRITICAL: Don't render children while still loading authentication/admin status
  // This prevents any flash of content or premature access denied messages
  if (loading || adminLoading || isCheckingAdmin) {
    return null;
  }

  // Don't render children if user should be redirected (not authenticated)
  if (requireAuth && !user) {
    return null;
  }

  // CRITICAL: For admin routes, only render if user has confirmed admin access
  // Don't render if admin is required but user doesn't have access
  // We must be absolutely certain before rendering (all loading complete + user exists + has access)
  if (requireAuth && requireAdmin) {
    // Only render if we have confirmed admin access (not just "not loading")
    if (!user || !hasAdminAccess) {
      return null;
    }
  }

  // Don't render children if user is authenticated admin on non-auth pages
  if (!requireAuth && user && hasAdminAccess) {
    return null;
  }

  // All checks passed - render children
  // At this point, we know:
  // - User is authenticated (if requireAuth)
  // - User has admin access (if requireAdmin) - CONFIRMED, not just "loading complete"
  // - All loading is complete
  return <>{children}</>;
}

// Higher-order component for protecting pages
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: { redirectTo?: string; requireAuth?: boolean }
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
