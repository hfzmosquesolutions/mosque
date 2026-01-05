'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserMosque, useAdminAccess } from '@/hooks/useUserRole';
import { MosqueKhairatContributions } from '@/components/khairat/MosqueKhairatContributions';
import { UserPaymentsTable } from '@/components/khairat/UserPaymentsTable';
import { PageLoading } from '@/components/ui/page-loading';
import { useAuth } from '@/contexts/AuthContext';

function PaymentHistoryContent() {
  const t = useTranslations('khairat');
  const { mosqueId, loading: mosqueLoading } = useUserMosque();
  const { hasAdminAccess } = useAdminAccess();
  const { user } = useAuth();
  const [userPayments, setUserPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  useEffect(() => {
    if (user && !hasAdminAccess) {
      // Fetch user's own payment history
      const fetchUserPayments = async () => {
        try {
          setLoadingPayments(true);
          const { getUserPaymentHistory } = await import('@/lib/api');
          const result = await getUserPaymentHistory(user.id);
          if (result.success && result.data) {
            setUserPayments(result.data);
          }
        } catch (error) {
          console.error('Error fetching user payments:', error);
        } finally {
          setLoadingPayments(false);
        }
      };
      fetchUserPayments();
    }
  }, [user, hasAdminAccess]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('khairatPayments')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {hasAdminAccess 
            ? t('khairatPaymentsDescription') 
            : 'View your khairat payment history'}
        </p>
      </div>

      {hasAdminAccess ? (
        // Admin view: show mosque contributions
        mosqueLoading ? (
          <PageLoading />
        ) : mosqueId ? (
          <MosqueKhairatContributions mosqueId={mosqueId} showHeader={false} />
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t('noMosqueAssociated')}</p>
          </div>
        )
      ) : (
        // User view: show own payments
        loadingPayments ? (
          <PageLoading />
        ) : userPayments.length > 0 ? (
          <UserPaymentsTable contributions={userPayments} showHeader={false} />
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No payment history found</p>
          </div>
        )
      )}
    </div>
  );
}

export default function PaymentHistoryPage() {
  const t = useTranslations('khairat');
  
  return (
    <ProtectedRoute requireAdmin={false}>
      <DashboardLayout title={t('paymentHistory')}>
        <PaymentHistoryContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

