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

function MyMosquesContent() {
  const router = useRouter();
  const { hasAdminAccess, loading: adminLoading } = useAdminAccess();

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
            My Mosques
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            View and manage your khairat memberships and applications
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
          <Link href="/mosques" target="_blank" rel="noopener noreferrer">
            <Building className="mr-2 h-4 w-4" /> Find Mosque
          </Link>
        </Button>
      </div>

      <UserApplicationsTable showHeader={false} />
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


