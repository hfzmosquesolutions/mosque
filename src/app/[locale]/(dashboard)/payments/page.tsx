'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserMosque } from '@/hooks/useUserRole';
import { MosqueKhairatContributions } from '@/components/khairat/MosqueKhairatContributions';
import { PageLoading } from '@/components/ui/page-loading';

function PaymentHistoryContent() {
  const t = useTranslations('khairat');
  const { mosqueId, loading: mosqueLoading } = useUserMosque();

  // ProtectedRoute already handles access control
  // If we reach here, user is authenticated and has admin access

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

      {mosqueLoading ? (
        <PageLoading />
      ) : mosqueId ? (
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

