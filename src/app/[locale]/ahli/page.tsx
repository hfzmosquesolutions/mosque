'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAdminAccess, useUserMosque } from '@/hooks/useUserRole';
import { useRouter } from 'next/navigation';
import { useOnboardingRedirect } from '@/hooks/useOnboardingStatus';
import { KhairatManagement } from '@/components/admin/KhairatManagement';

function KhairatApplicationsContent() {
  const t = useTranslations('khairat');
  const { hasAdminAccess, loading: adminLoading } = useAdminAccess();
  const { mosqueId } = useUserMosque();
  const { isCompleted, isLoading: onboardingLoading } = useOnboardingRedirect();
  const router = useRouter();

  // Redirect normal users away from admin-only page
  useEffect(() => {
    if (!onboardingLoading && isCompleted && !adminLoading && !hasAdminAccess) {
      router.replace('/dashboard');
    }
  }, [hasAdminAccess, adminLoading, onboardingLoading, isCompleted, router]);

  if (onboardingLoading || !isCompleted || adminLoading) {
    return null;
  }

  // Do not render anything for non-admin users
  if (!hasAdminAccess) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header with Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Khairat applications
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Review and approve khairat applications from your mosque members in a single, simple view.
        </p>
      </div>

      {mosqueId ? (
        <KhairatManagement mosqueId={mosqueId} />
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No mosque associated</p>
        </div>
      )}
    </div>
  );
}

export default function KhairatApplicationsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout title="Khairat Applications">
        <KhairatApplicationsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

