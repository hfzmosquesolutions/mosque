'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAdminAccess, useUserMosque } from '@/hooks/useUserRole';
import { useRouter } from 'next/navigation';
import { useOnboardingRedirect } from '@/hooks/useOnboardingStatus';
import { KhairatManagement } from '@/components/admin/KhairatManagement';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

function KhairatMembersContent() {
  const t = useTranslations('khairatManagement');
  const { hasAdminAccess, loading: adminLoading } = useAdminAccess();
  const { mosqueId } = useUserMosque();
  const { isCompleted, isLoading: onboardingLoading } = useOnboardingRedirect();
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Redirect normal users away from admin-only page
  useEffect(() => {
    if (!onboardingLoading && isCompleted && !adminLoading && !hasAdminAccess) {
      router.replace('/dashboard');
    }
  }, [hasAdminAccess, adminLoading, onboardingLoading, isCompleted, router]);

  if (onboardingLoading || !isCompleted || adminLoading) {
    return null;
  }

  // Do not render anything for non-admin users
  if (!hasAdminAccess) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header with Title, Description, and Register Button */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Khairat Members
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage khairat members, review applications, and maintain member records
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Register New Member
        </Button>
      </div>

      {mosqueId ? (
        <KhairatManagement 
          mosqueId={mosqueId} 
          createDialogOpen={createDialogOpen}
          onCreateDialogChange={setCreateDialogOpen}
        />
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No mosque associated</p>
        </div>
      )}
    </div>
  );
}

export default function KhairatMembersPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout title="Khairat Members">
        <KhairatMembersContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

