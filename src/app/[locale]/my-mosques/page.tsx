'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Building, CreditCard, FileText, Heart } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/useUserRole';
import { UserPaymentsTable } from '@/components/khairat/UserPaymentsTable';
import { UserClaimsTable } from '@/components/khairat/UserClaimsTable';
import { UserApplicationsTable } from '@/components/khairat/UserApplicationsTable';
import { Loading } from '@/components/ui/loading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getUserPaymentHistory } from '@/lib/api';

function MyMosquesContent() {
  const t = useTranslations('mosques');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { hasAdminAccess, loading: adminLoading } = useAdminAccess();
  const [loading, setLoading] = useState(true);
  const [userContributions, setUserContributions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab');
    return tab === 'claims' || tab === 'payments' ? tab : 'my-mosques';
  });

  // If admin, redirect them to the admin Khairat members page
  useEffect(() => {
    if (!adminLoading && hasAdminAccess) {
      router.replace('/members');
    }
  }, [adminLoading, hasAdminAccess, router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const paymentHistoryResult = await getUserPaymentHistory(user.id);
      setUserContributions(paymentHistoryResult.data || []);
    } catch (e) {
      console.error('Error fetching user payment history', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  if (adminLoading || hasAdminAccess) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header with Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          My Mosques
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-600">
          <TabsTrigger 
            value="my-mosques" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            <Heart className="h-4 w-4" />
            My Mosques
          </TabsTrigger>
          <TabsTrigger 
            value="payments" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            <CreditCard className="h-4 w-4" />
            Payment History
          </TabsTrigger>
          <TabsTrigger 
            value="claims" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            <FileText className="h-4 w-4" />
            Claim History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-mosques" forceMount className="space-y-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              My Mosques
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              View and manage your khairat memberships and claims
            </p>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
              <Link href="/mosques" target="_blank" rel="noopener noreferrer">
                <Building className="mr-2 h-4 w-4" /> Find Mosque
              </Link>
            </Button>
          </div>
          <UserApplicationsTable showHeader={false} />
        </TabsContent>

        <TabsContent value="payments" forceMount className="space-y-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Payment History
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                View your payment history
              </p>
            </div>
          </div>
          
          {loading ? (
            <Loading message={t('loadingKhairatData')} />
          ) : (
            <UserPaymentsTable contributions={userContributions as any} showHeader={false} />
          )}
        </TabsContent>

        <TabsContent value="claims" forceMount className="space-y-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Claim History
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                View and manage your khairat claims
              </p>
            </div>
          </div>
          <UserClaimsTable showHeader={false} />
        </TabsContent>
      </Tabs>
      
    </div>
  );
}

export default function MyMosquesPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout title="My Mosques">
        <MyMosquesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}


