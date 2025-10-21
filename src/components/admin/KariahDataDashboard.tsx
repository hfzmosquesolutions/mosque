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
      {/* Header with Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('kariahManagement')}</h1>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-600">
          <TabsTrigger 
            value="applications" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            <FileText className="h-4 w-4" />
            {t('applications')}
          </TabsTrigger>
          <TabsTrigger 
            value="memberships" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            <Users className="h-4 w-4" />
            {t('memberships')}
          </TabsTrigger>
          <TabsTrigger 
            value="legacy-data" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            <Database className="h-4 w-4" />
            {t('legacyData')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="memberships" forceMount className="space-y-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {t('memberships')}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Manage kariah members and member information
              </p>
            </div>
          </div>
          <KariahMembershipManagement mosqueId={mosqueId} />
        </TabsContent>

        <TabsContent value="applications" forceMount className="space-y-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {t('applications')}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Review and manage kariah member registrations
              </p>
            </div>
          </div>
          <KariahApplicationsReview mosqueId={mosqueId} />
        </TabsContent>

        <TabsContent value="legacy-data" forceMount className="space-y-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {t('legacyData')}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Import and manage legacy kariah data from external sources
              </p>
            </div>
          </div>
          <LegacyDataManagement mosqueId={mosqueId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
