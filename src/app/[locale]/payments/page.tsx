'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAdminAccess, useUserMosque } from '@/hooks/useUserRole';
import { useRouter } from 'next/navigation';
import { useOnboardingRedirect } from '@/hooks/useOnboardingStatus';
import { useAuth } from '@/contexts/AuthContext';
import { MosqueKhairatContributions } from '@/components/khairat/MosqueKhairatContributions';
import { UserPaymentsTable } from '@/components/khairat/UserPaymentsTable';
import { getUserKhairatContributions } from '@/lib/api';
import type { KhairatContribution } from '@/types/database';

function KhairatPaymentsContent() {
  const t = useTranslations('khairat');
  const { user } = useAuth();
  const { hasAdminAccess, loading: adminLoading } = useAdminAccess();
  const { mosqueId } = useUserMosque();
  const { isCompleted, isLoading: onboardingLoading } = useOnboardingRedirect();
  const router = useRouter();
  const [userContributions, setUserContributions] = useState<KhairatContribution[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect normal users away from admin-only page (but they can still access their own payments)
  // Actually, we want both admin and regular users to access this page
  // Admin sees all payments, regular users see their own

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (!hasAdminAccess) {
        // Fetch user's own contributions
        const contributionsResult = await getUserKhairatContributions(user.id);
        setUserContributions(contributionsResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching khairat data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, hasAdminAccess]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData, isCompleted, onboardingLoading]);

  if (onboardingLoading || !isCompleted || adminLoading) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loadingKhairatData')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Khairat payments
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {hasAdminAccess
            ? 'Review and track all khairat payments made to your mosque in one clear view.'
            : 'See your khairat payment history and contributions to your mosque in one place.'}
        </p>
      </div>

      {hasAdminAccess ? (
        mosqueId ? (
          <MosqueKhairatContributions mosqueId={mosqueId} showHeader={false} />
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No mosque associated</p>
          </div>
        )
      ) : (
        <UserPaymentsTable contributions={userContributions as any} />
      )}
    </div>
  );
}

export default function KhairatPaymentsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout title="Khairat Payments">
        <KhairatPaymentsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

