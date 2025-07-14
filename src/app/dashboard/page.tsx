'use client';

import { useAuthState } from '@/hooks/useAuth.v2';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { DashboardLoadingScreen } from '@/components/ui/loading';
import { createUserFromAuth } from '@/utils/userUtils';

export default function DashboardPage() {
  const { user: authUser, profile, isLoading } = useAuthState();

  if (isLoading) {
    return <DashboardLoadingScreen />;
  }

  if (!authUser || !profile) {
    return <AuthLayout>Access denied</AuthLayout>;
  }

  const user = createUserFromAuth(authUser, profile);

  return (
    <AuthLayout>
      <Dashboard user={user} />
    </AuthLayout>
  );
}
