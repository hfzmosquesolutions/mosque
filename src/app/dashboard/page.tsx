'use client';

import { Dashboard } from '@/components/dashboard/Dashboard';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();

  return <AuthLayout>{user && <Dashboard user={user} />}</AuthLayout>;
}
