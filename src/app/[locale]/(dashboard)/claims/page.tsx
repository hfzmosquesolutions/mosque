'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserMosque } from '@/hooks/useUserRole';
import { ClaimsManagement } from '@/components/admin/ClaimsManagement';
import { useSafeAsync } from '@/hooks/useSafeAsync';
import { PageLoading } from '@/components/ui/page-loading';

function KhairatClaimsContent() {
  const t = useTranslations('claims');
  const { mosqueId, loading: mosqueLoading } = useUserMosque();
  const { isMounted } = useSafeAsync();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ProtectedRoute already handles access control
  // If we reach here, user is authenticated and has admin access

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('khairatClaims')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {t('khairatClaimsDescription')}
        </p>
      </div>

      {mosqueLoading ? (
        <PageLoading />
      ) : mosqueId ? (
        <ClaimsManagement mosqueId={mosqueId} showHeader={false} />
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
    <ProtectedRoute>
      <DashboardLayout title={t('khairatClaims')}>
        <KhairatClaimsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

