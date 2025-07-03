'use client';

import { ReactNode, memo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { ClientOnly } from '@/components/layout/ClientOnly';

interface AuthLayoutProps {
  children: ReactNode;
}

// Loading component for fallback
function AuthLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// Internal AuthLayout component
function AuthLayoutInternal({ children }: AuthLayoutProps) {
  const { user, isLoading, logout } = useAuth(true);

  if (isLoading) {
    return <AuthLoadingFallback />;
  }

  if (!user) {
    // The useAuth hook will handle redirection
    return <AuthLoadingFallback />;
  }

  return (
    <Layout user={user} onLogout={logout}>
      {children}
    </Layout>
  );
}

// Memoize the AuthLayout and wrap with ClientOnly to prevent hydration issues
export const AuthLayout = memo(function AuthLayout({
  children,
}: AuthLayoutProps) {
  return (
    <ClientOnly fallback={<AuthLoadingFallback />}>
      <AuthLayoutInternal>{children}</AuthLayoutInternal>
    </ClientOnly>
  );
});
