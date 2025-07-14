'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState, useAuthGuards } from '@/hooks/useAuth.v2';
import { AuthLoadingScreen } from '@/components/ui/loading';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireGuest?: boolean;
  requireOnboarding?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * Enhanced Authentication Guard Component
 * Provides flexible authentication protection with multiple guard types
 */
export function AuthGuard({
  children,
  requireAuth = false,
  requireGuest = false,
  requireOnboarding = false,
  redirectTo,
  fallback,
}: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isInitialized, needsOnboarding, isLoading } = useAuthState();
  const guards = useAuthGuards();

  useEffect(() => {
    if (!isInitialized || isLoading) {
      return; // Wait for auth to initialize
    }

    // Handle authentication requirement
    if (requireAuth && !isAuthenticated) {
      const redirect = redirectTo || '/login';
      router.push(redirect);
      return;
    }

    // Handle guest requirement (user should not be authenticated)
    if (requireGuest && isAuthenticated) {
      const redirect = redirectTo || '/dashboard';
      router.push(redirect);
      return;
    }

    // Handle onboarding requirement
    if (requireOnboarding && !needsOnboarding) {
      const redirect = redirectTo || '/dashboard';
      router.push(redirect);
      return;
    }

    // Handle case where user needs onboarding but is trying to access other pages
    if (isAuthenticated && needsOnboarding && !requireOnboarding) {
      router.push('/onboarding');
      return;
    }
  }, [isInitialized, isLoading, isAuthenticated, needsOnboarding, requireAuth, requireGuest, requireOnboarding, redirectTo, router]);

  // Show loading while initializing
  if (!isInitialized || isLoading) {
    return fallback || <AuthLoadingScreen />;
  }

  // Check guards
  if (requireAuth && !guards.requireAuth) {
    return fallback || <AuthLoadingScreen />;
  }

  if (requireGuest && !guards.requireGuest) {
    return fallback || <AuthLoadingScreen />;
  }

  if (requireOnboarding && !guards.requireOnboarding) {
    return fallback || <AuthLoadingScreen />;
  }

  // Redirect authenticated users who need onboarding
  if (isAuthenticated && needsOnboarding && !requireOnboarding) {
    return fallback || <AuthLoadingScreen />;
  }

  return <>{children}</>;
}

/**
 * Require Authentication Guard
 * Redirects to login if user is not authenticated
 */
export function RequireAuth({
  children,
  redirectTo = '/login',
  fallback,
}: {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}) {
  return (
    <AuthGuard requireAuth redirectTo={redirectTo} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

/**
 * Require Guest Guard
 * Redirects to dashboard if user is authenticated
 */
export function RequireGuest({
  children,
  redirectTo = '/dashboard',
  fallback,
}: {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}) {
  return (
    <AuthGuard requireGuest redirectTo={redirectTo} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

/**
 * Require Onboarding Guard
 * Ensures user completes onboarding before accessing other pages
 */
export function RequireOnboarding({
  children,
  redirectTo = '/dashboard',
  fallback,
}: {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}) {
  return (
    <AuthGuard requireOnboarding redirectTo={redirectTo} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

/**
 * Role-based Guard
 * Protects content based on user roles
 */
export function RoleGuard({
  children,
  allowedRoles,
  fallback,
  redirectTo = '/dashboard',
}: {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const { profile, isAuthenticated, isInitialized } = useAuthState();

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (profile && !allowedRoles.includes(profile.role)) {
      router.push(redirectTo);
      return;
    }
  }, [isInitialized, isAuthenticated, profile, allowedRoles, redirectTo, router]);

  if (!isInitialized) {
    return fallback || <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return fallback || <AuthLoadingScreen />;
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Admin Guard
 * Protects admin-only content
 */
export function AdminGuard({
  children,
  fallback,
  redirectTo = '/dashboard',
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}) {
  return (
    <RoleGuard allowedRoles={['admin']} fallback={fallback} redirectTo={redirectTo}>
      {children}
    </RoleGuard>
  );
}

/**
 * Moderator Guard
 * Protects moderator and admin content
 */
export function ModeratorGuard({
  children,
  fallback,
  redirectTo = '/dashboard',
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}) {
  return (
    <RoleGuard allowedRoles={['admin', 'moderator']} fallback={fallback} redirectTo={redirectTo}>
      {children}
    </RoleGuard>
  );
}

/**
 * Conditional Auth Component
 * Shows different content based on authentication state
 */
export function ConditionalAuth({
  authenticated,
  unauthenticated,
  loading,
}: {
  authenticated: React.ReactNode;
  unauthenticated: React.ReactNode;
  loading?: React.ReactNode;
}) {
  const { isAuthenticated, isInitialized } = useAuthState();

  if (!isInitialized) {
    return <>{loading || <AuthLoadingScreen />}</>;
  }

  return <>{isAuthenticated ? authenticated : unauthenticated}</>;
}

/**
 * Permission-based Component
 * Shows content based on user permissions
 */
export function PermissionGuard({
  children,
  permission,
  fallback,
}: {
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
}) {
  const { profile } = useAuthState();
  
  // Define permission mappings
  const hasPermission = (perm: string): boolean => {
    const role = profile?.role || 'member';
    
    const permissions: Record<string, string[]> = {
      'view_dashboard': ['admin', 'moderator', 'member'],
      'manage_users': ['admin', 'moderator'],
      'manage_content': ['admin', 'moderator'],
      'view_reports': ['admin', 'moderator'],
      'manage_finance': ['admin'],
      'delete_users': ['admin'],
      'manage_settings': ['admin'],
      'view_all_profiles': ['admin', 'moderator'],
    };
    
    return permissions[perm]?.includes(role) || false;
  };
  
  if (!hasPermission(permission)) {
    return <>{fallback || null}</>;
  }
  
  return <>{children}</>;
}

export default AuthGuard;