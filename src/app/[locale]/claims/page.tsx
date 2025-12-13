'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAdminAccess, useUserMosque } from '@/hooks/useUserRole';
import { useOnboardingRedirect } from '@/hooks/useOnboardingStatus';
import { ClaimsManagement } from '@/components/admin/ClaimsManagement';
import { UserClaimsTable } from '@/components/khairat/UserClaimsTable';
import { Loading } from '@/components/ui/loading';
import { useSafeAsync } from '@/hooks/useSafeAsync';

function KhairatClaimsContent() {
  const t = useTranslations('claims');
  const { hasAdminAccess, loading: adminLoading } = useAdminAccess();
  const { mosqueId } = useUserMosque();
  const { isCompleted, isLoading: onboardingLoading } = useOnboardingRedirect();
  const { isMounted } = useSafeAsync();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  if (onboardingLoading || !isCompleted || adminLoading) {
    return (
      <Loading 
        message={t('loadingClaims')} 
        size="lg"
        className="py-12"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {hasAdminAccess ? t('khairatClaims') : t('claimHistory')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {hasAdminAccess
            ? t('khairatClaimsDescription')
            : t('claimHistoryDescription')}
        </p>
      </div>

      {hasAdminAccess ? (
        mosqueId ? (
          <ClaimsManagement mosqueId={mosqueId} showHeader={false} />
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t('unknownMosque')}</p>
          </div>
        )
      ) : (
        <UserClaimsTable showHeader={false} />
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

