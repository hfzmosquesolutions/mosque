'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KariahApplicationForm } from '@/components/user/KariahApplicationForm';
import { useOnboardingRedirect } from '@/hooks/useOnboardingStatus';

function KariahApplicationContent() {
  const { isCompleted, isLoading: onboardingLoading } = useOnboardingRedirect();

  if (onboardingLoading || !isCompleted) {
    return null;
  }

  return (
    <DashboardLayout title="Kariah Application">
      <KariahApplicationForm />
    </DashboardLayout>
  );
}

export default function KariahApplicationPage() {
  return (
    <ProtectedRoute>
      <KariahApplicationContent />
    </ProtectedRoute>
  );
}
