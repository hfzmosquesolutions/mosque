'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess, useUserMosque } from '@/hooks/useUserRole';
import { getMosque } from '@/lib/api';
import { KariahDataDashboard } from '@/components/admin/KariahDataDashboard';
import type { Mosque } from '@/types/database';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function KariahContent() {
  const t = useTranslations('kariah');
  const { user } = useAuth();
  const { hasAdminAccess } = useAdminAccess();
  const { mosqueId } = useUserMosque();
  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMosqueData() {
      if (!mosqueId) {
        setLoading(false);
        return;
      }

      try {
        const mosqueResult = await getMosque(mosqueId);
        if (mosqueResult.success && mosqueResult.data) {
          setMosque(mosqueResult.data);
        }
      } catch (error) {
        console.error('Error loading mosque data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadMosqueData();
  }, [mosqueId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading kariah data...</span>
        </div>
      </div>
    );
  }

  // Only allow admin users with mosque access
  if (!mosqueId || !mosque) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You need to be a mosque administrator to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You need administrator privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <KariahDataDashboard mosqueId={mosqueId} mosqueName={mosque.name} />
    </div>
  );
}

export default function KariahPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <KariahContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
