'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Users, UserCheck, FileText } from 'lucide-react';
import { LegacyDataManagement } from './LegacyDataManagement';
import { KariahApplicationsReview } from './KariahApplicationsReview';
import { KariahMembershipManagement } from './KariahMembershipManagement';

interface LegacyKhairatDashboardProps {
  mosqueId: string;
  mosqueName: string;
}

export function LegacyKhairatDashboard({
  mosqueId,
  mosqueName,
}: LegacyKhairatDashboardProps) {
  const [activeTab, setActiveTab] = useState('legacy-data');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Legacy Khairat Integration
        </h1>
        <p className="text-muted-foreground">
          Manage legacy khairat data, kariah applications, and memberships for{' '}
          {mosqueName}
        </p>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="legacy-data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Legacy Data
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="memberships" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Memberships
          </TabsTrigger>
        </TabsList>

        <TabsContent value="legacy-data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Legacy Data Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LegacyDataManagement mosqueId={mosqueId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Kariah Applications Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <KariahApplicationsReview mosqueId={mosqueId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memberships" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Kariah Membership Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <KariahMembershipManagement mosqueId={mosqueId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
