'use client';

import { useTranslations } from 'next-intl';
import { KariahManagement } from './KariahManagement';

interface KariahDataDashboardProps {
  mosqueId: string;
  mosqueName: string;
}

export function KariahDataDashboard({
  mosqueId,
  mosqueName,
}: KariahDataDashboardProps) {
  const t = useTranslations('kariahManagement');

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
              Manage kariah applications and memberships in one unified interface
            </p>
          </div>
        </div>
      </div>

      {/* Kariah Management Component */}
      <KariahManagement mosqueId={mosqueId} />
    </div>
  );
}
