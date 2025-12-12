'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export function ProtectedRoute({
  children,
  redirectTo = '/login',
  requireAuth = true,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // Redirect to login
        router.push(redirectTo);
      } else if (!requireAuth && user) {
        // Redirect authenticated users away from auth pages
        // Check for returnUrl in sessionStorage first, then query params, then default to dashboard
        const returnUrl = 
          (typeof window !== 'undefined' && sessionStorage.getItem('returnUrl')) ||
          searchParams.get('returnUrl') ||
          '/dashboard';
        
        // Clear the returnUrl from sessionStorage after reading it
        if (typeof window !== 'undefined' && sessionStorage.getItem('returnUrl')) {
          sessionStorage.removeItem('returnUrl');
        }
        
        // Use window.location.href to ensure a full page reload and prevent redirect loops
        if (returnUrl && returnUrl !== '/dashboard') {
          window.location.href = returnUrl;
        } else {
          router.push('/dashboard');
        }
      }
    }
  }, [user, loading, router, redirectTo, requireAuth, searchParams]);

  // Show loading spinner while checking authentication
  if (loading) {
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

  if (!requireAuth && user) {
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
