'use client';

import { ReportsOverview } from '@/components/reports/ReportsOverview';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useAuthState } from '@/hooks/useAuth.v2';
import { createUserFromAuth } from '@/utils/userUtils';

export default function ReportsPage() {
  const { user: authUser, profile } = useAuthState();

  if (!authUser || !profile) {
    return <AuthLayout>Access denied</AuthLayout>;
  }

  const user = createUserFromAuth(authUser, profile);

  return (
    <AuthLayout>
      <ReportsOverview user={user} />
    </AuthLayout>
  );
}
