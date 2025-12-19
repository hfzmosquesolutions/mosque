'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAdminAccess, useUserMosque } from '@/hooks/useUserRole';
import { useOnboardingRedirect } from '@/hooks/useOnboardingStatus';
import { useAuth } from '@/contexts/AuthContext';
import { MosqueKhairatContributions } from '@/components/khairat/MosqueKhairatContributions';
import { UserPaymentsTable } from '@/components/khairat/UserPaymentsTable';
import { getUserPaymentHistory } from '@/lib/api';
import type { KhairatContribution } from '@/types/database';
import { Loading } from '@/components/ui/loading';
import { useSafeAsync } from '@/hooks/useSafeAsync';

function PaymentHistoryContent() {
  const t = useTranslations('khairat');
  const { user } = useAuth();
  const { hasAdminAccess, loading: adminLoading } = useAdminAccess();
  const { mosqueId } = useUserMosque();
  const { isCompleted, isLoading: onboardingLoading } = useOnboardingRedirect();
  const [userContributions, setUserContributions] = useState<KhairatContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const { safeSetState, isMounted } = useSafeAsync();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Redirect normal users away from admin-only page (but they can still access their own payments)
  // Actually, we want both admin and regular users to access this page
  // Admin sees all payments, regular users see their own

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    // Create new abort controller for this fetch
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    safeSetState(setLoading, true as boolean);
    try {
      if (!hasAdminAccess) {
        // Fetch user's combined payment history (legacy + current)
        const paymentHistoryResult = await getUserPaymentHistory(user.id);
        if (!signal.aborted && isMounted()) {
          safeSetState(setUserContributions, (paymentHistoryResult.data || []) as KhairatContribution[]);
        }
      }
    } catch (error) {
      if (!signal.aborted && isMounted()) {
        console.error('Error fetching payment history:', error);
      }
    } finally {
      if (!signal.aborted && isMounted()) {
        safeSetState(setLoading, false as boolean);
      }
    }
  }, [user, hasAdminAccess, safeSetState, isMounted]);

  useEffect(() => {
    if (user && isCompleted && !onboardingLoading) {
      fetchData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [user, fetchData, isCompleted, onboardingLoading]);

  if (onboardingLoading || !isCompleted || adminLoading || loading) {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {hasAdminAccess ? t('khairatPayments') : t('paymentHistory')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {hasAdminAccess
            ? t('khairatPaymentsDescription')
            : t('paymentHistoryDescription')}
        </p>
      </div>

      {hasAdminAccess ? (
        mosqueId ? (
          <MosqueKhairatContributions mosqueId={mosqueId} showHeader={false} />
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t('noMosqueAssociated')}</p>
          </div>
        )
      ) : (
        <UserPaymentsTable contributions={userContributions as any} />
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

