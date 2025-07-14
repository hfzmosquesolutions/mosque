'use client';

import { ReactNode, memo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuthState, useAuthActions } from '@/hooks/useAuth.v2';
import { ClientOnly } from '@/components/layout/ClientOnly';
import { createUserFromAuth } from '@/utils/userUtils';

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
  const { user: authUser, profile, isLoading } = useAuthState();
  const { signOut } = useAuthActions();

  if (isLoading) {
    return <AuthLoadingFallback />;
  }

  if (!authUser || !profile) {
    // The useAuth hook will handle redirection
    return <AuthLoadingFallback />;
  }

  const user = createUserFromAuth(authUser, profile);

  return (
    <Layout user={user} onLogout={signOut}>
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
