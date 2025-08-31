'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Database, Users, UserCheck, FileText } from 'lucide-react';
import { LegacyDataManagement } from './LegacyDataManagement';
import { KariahApplicationsReview } from './KariahApplicationsReview';
import { KariahMembershipManagement } from './KariahMembershipManagement';

interface KariahDataDashboardProps {
  mosqueId: string;
  mosqueName: string;
}

export function KariahDataDashboard({
  mosqueId,
  mosqueName,
}: KariahDataDashboardProps) {
  const t = useTranslations('kariahManagement');
  const [activeTab, setActiveTab] = useState('applications');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t('kariahManagement')}</h1>
        <p className="text-muted-foreground">
          {t('manageKariahDataDescription', { mosqueName })}
        </p>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('applications')}
          </TabsTrigger>
          <TabsTrigger value="memberships" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('memberships')}
          </TabsTrigger>
          <TabsTrigger value="legacy-data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            {t('legacyData')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="memberships" className="space-y-6">
          <KariahMembershipManagement mosqueId={mosqueId} />
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          <KariahApplicationsReview mosqueId={mosqueId} />
        </TabsContent>

        <TabsContent value="legacy-data" className="space-y-6">
          <LegacyDataManagement mosqueId={mosqueId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
