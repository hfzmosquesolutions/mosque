'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAdminAccess, useUserMosque } from '@/hooks/useUserRole';
import { useOnboardingRedirect } from '@/hooks/useOnboardingStatus';
import { useAuth } from '@/contexts/AuthContext';
import { MosqueKhairatContributions } from '@/components/khairat/MosqueKhairatContributions';
import { UserPaymentsTable } from '@/components/khairat/UserPaymentsTable';
import { getUserKhairatContributions, getUserPaymentHistory } from '@/lib/api';
import type { KhairatContribution } from '@/types/database';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PaymentProviderSettings } from '@/components/settings/PaymentProviderSettings';
import { CreditCard } from 'lucide-react';
import { Loading } from '@/components/ui/loading';
import { useSafeAsync } from '@/hooks/useSafeAsync';

function KhairatPaymentsContent() {
  const t = useTranslations('khairat');
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { hasAdminAccess, loading: adminLoading } = useAdminAccess();
  const { mosqueId } = useUserMosque();
  const { isCompleted, isLoading: onboardingLoading } = useOnboardingRedirect();
  const [userContributions, setUserContributions] = useState<KhairatContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
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
    
    safeSetState(setLoading, true);
    try {
      if (!hasAdminAccess) {
        // Fetch user's combined payment history (legacy + current)
        const paymentHistoryResult = await getUserPaymentHistory(user.id);
        if (!signal.aborted && isMounted()) {
          safeSetState(setUserContributions, paymentHistoryResult.data || []);
        }
      }
    } catch (error) {
      if (!signal.aborted && isMounted()) {
        console.error('Error fetching payment history:', error);
      }
    } finally {
      if (!signal.aborted && isMounted()) {
        safeSetState(setLoading, false);
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

  // Auto-open payment modal if openModal query parameter is present
  useEffect(() => {
    if (hasAdminAccess && searchParams.get('openModal') === 'true') {
      setIsPaymentModalOpen(true);
    }
  }, [hasAdminAccess, searchParams]);

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
      <div className="flex items-center justify-between">
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
        {hasAdminAccess && (
          <Button
            onClick={() => setIsPaymentModalOpen(true)}
            className="flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            {t('setupPayment')}
          </Button>
        )}
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

      {/* Payment Gateway Setup Modal */}
      {hasAdminAccess && (
        <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('paymentGatewaySetup')}</DialogTitle>
              <DialogDescription>
                {t('paymentGatewaySetupDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <PaymentProviderSettings />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function KhairatPaymentsPage() {
  const t = useTranslations('khairat');
  
  return (
    <ProtectedRoute>
      <DashboardLayout title={t('khairatPayments')}>
        <KhairatPaymentsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

