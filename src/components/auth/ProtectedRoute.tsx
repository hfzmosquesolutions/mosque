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

  // Show loading spinner while checking authentication
  if (loading || adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
              <div
                className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"
                style={{ animationDelay: '0.1s' }}
              ></div>
              <div
                className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"
                style={{ animationDelay: '0.2s' }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Don't render children if user should be redirected
  if (requireAuth && !user) {
    return null;
  }

  // If checking admin access and user is authenticated but admin status shows false,
  // show loading while double-checking (useEffect will handle the redirect if needed)
  if (requireAuth && requireAdmin && user && !hasAdminAccess && (!adminLoading || isCheckingAdmin)) {
    // Show loading while:
    // 1. Hook is still loading, OR
    // 2. We're double-checking admin status
    // The useEffect will either:
    // - Find user is admin and trigger refresh (then this will re-render with hasAdminAccess=true)
    // - Find user is not admin and redirect
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
              <div
                className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"
                style={{ animationDelay: '0.1s' }}
              ></div>
              <div
                className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"
                style={{ animationDelay: '0.2s' }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!requireAuth && user && hasAdminAccess) {
    return null;
  }

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
