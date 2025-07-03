'use client';

import { ReportsOverview } from '@/components/reports/ReportsOverview';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useAuth } from '@/hooks/useAuth';

export default function ReportsPage() {
  const { user } = useAuth();

  return <AuthLayout>{user && <ReportsOverview user={user} />}</AuthLayout>;
}
