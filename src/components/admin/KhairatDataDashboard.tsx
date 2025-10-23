'use client';

import { useTranslations } from 'next-intl';
import { KhairatManagement } from './KhairatManagement';

interface KhairatDataDashboardProps {
  mosqueId: string;
  mosqueName: string;
}

export function KhairatDataDashboard({
  mosqueId,
  mosqueName,
}: KhairatDataDashboardProps) {
  const t = useTranslations('khairatManagement');

  return (
    <div className="space-y-6">
      {/* Standardized header (match claims section) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Applications & Memberships
            </h2>
            <p className="text-muted-foreground mt-1">
              Manage khairat applications and memberships in one unified interface
            </p>
          </div>
        </div>
      </div>

      {/* Khairat Management Component */}
      <KhairatManagement mosqueId={mosqueId} />
    </div>
  );
}
