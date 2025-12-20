'use client';

import { useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Building } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAdminAccess } from '@/hooks/useUserRole';
import { UserApplicationsTable } from '@/components/khairat/UserApplicationsTable';
import { useTranslations } from 'next-intl';

function MyMosquesContent() {
  const router = useRouter();
  const { hasAdminAccess, loading: adminLoading } = useAdminAccess();
  const t = useTranslations('docs.myMosques');

  // If admin, redirect them to the admin Khairat members page
  useEffect(() => {
    if (!adminLoading && hasAdminAccess) {
      router.replace('/members');
    }
  }, [adminLoading, hasAdminAccess, router]);


  if (adminLoading || hasAdminAccess) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('title')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {t('pageDescription')}
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
          <Link href="/mosques" target="_blank" rel="noopener noreferrer">
            <Building className="mr-2 h-4 w-4" /> {t('findMosque')}
          </Link>
        </Button>
      </div>

      <UserApplicationsTable showHeader={false} />
    </div>
  );
}

export default function MyMosquesPage() {
  const t = useTranslations('docs.myMosques');
  return (
    <ProtectedRoute>
      <DashboardLayout title={t('title')}>
        <MyMosquesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}


