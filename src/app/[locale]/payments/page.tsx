'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAdminAccess, useUserMosque } from '@/hooks/useUserRole';
import { MosqueKhairatContributions } from '@/components/khairat/MosqueKhairatContributions';
import { Loading } from '@/components/ui/loading';

function PaymentHistoryContent() {
  const t = useTranslations('khairat');
  const { hasAdminAccess, loading: adminLoading } = useAdminAccess();
  const { mosqueId } = useUserMosque();

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loading 
            message={t('loadingKhairatData')} 
            size="lg"
          />
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Access denied. Only mosque administrators can access payment management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('khairatPayments')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {t('khairatPaymentsDescription')}
        </p>
      </div>

      {mosqueId ? (
        <MosqueKhairatContributions mosqueId={mosqueId} showHeader={false} />
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t('noMosqueAssociated')}</p>
        </div>
      )}
    </div>
  );
}

export default function PaymentHistoryPage() {
  const t = useTranslations('khairat');
  
  return (
    <ProtectedRoute>
      <DashboardLayout title={t('paymentHistory')}>
        <PaymentHistoryContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

