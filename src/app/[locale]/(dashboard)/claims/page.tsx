'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserRole } from '@/hooks/useUserRole';
import { ClaimsManagement } from '@/components/admin/ClaimsManagement';
import { UserClaimsTable } from '@/components/khairat/UserClaimsTable';
import { useSafeAsync } from '@/hooks/useSafeAsync';
import { PageLoading } from '@/components/ui/page-loading';
import { useAuth } from '@/contexts/AuthContext';

function KhairatClaimsContent() {
  const t = useTranslations('claims');
  const { mosqueId, loading: mosqueLoading, isAdmin: hasAdminAccess } = useUserRole();
  const { user } = useAuth();
  const { isMounted } = useSafeAsync();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('khairatClaims')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {hasAdminAccess 
            ? t('khairatClaimsDescription') 
            : 'View and manage your khairat claims'}
        </p>
      </div>

      {mosqueLoading ? (
        <PageLoading />
      ) : hasAdminAccess && mosqueId ? (
        <ClaimsManagement mosqueId={mosqueId} showHeader={false} />
      ) : user ? (
        <UserClaimsTable showHeader={false} />
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t('unknownMosque')}</p>
        </div>
      )}
    </div>
  );
}

export default function KhairatClaimsPage() {
  const t = useTranslations('claims');
  
  return (
    <ProtectedRoute requireAdmin={false}>
      <DashboardLayout title={t('khairatClaims')}>
        <KhairatClaimsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

