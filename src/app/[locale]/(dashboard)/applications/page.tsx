'use client';

import { useTranslations } from 'next-intl';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserMosque } from '@/hooks/useUserRole';
import { KhairatManagement } from '@/components/admin/KhairatManagement';
import { PageLoading } from '@/components/ui/page-loading';

function KhairatApplicationsContent() {
  const t = useTranslations('khairatManagement');
  const { mosqueId, loading: mosqueLoading } = useUserMosque();

  // ProtectedRoute already handles access control
  // If we reach here, user is authenticated and has admin access

  return (
    <div className="space-y-6">
      {/* Header with Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('khairatApplications')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {t('khairatApplicationsDescription')}
        </p>
      </div>

      {mosqueLoading ? (
        <PageLoading />
      ) : mosqueId ? (
        <KhairatManagement mosqueId={mosqueId} />
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t('noMosqueAssociated')}</p>
        </div>
      )}
    </div>
  );
}

export default function KhairatApplicationsPage() {
  const t = useTranslations('khairatManagement');
  
  return (
    <ProtectedRoute>
      <DashboardLayout title={t('khairatApplications')}>
        <KhairatApplicationsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

