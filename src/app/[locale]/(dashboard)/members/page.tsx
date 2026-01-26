'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserMosque } from '@/hooks/useUserRole';
import { KhairatManagement } from '@/components/admin/KhairatManagement';
import { PageLoading } from '@/components/ui/page-loading';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Upload, UserPlus, ChevronDown } from 'lucide-react';

function KhairatMembersContent() {
  const t = useTranslations('khairatManagement');
  const { mosqueId, loading: mosqueLoading } = useUserMosque();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [bulkUploadDialogOpen, setBulkUploadDialogOpen] = useState(false);

  // ProtectedRoute already handles access control
  // If we reach here, user is authenticated and has admin access

  return (
    <div className="space-y-6">
      {/* Header with Title, Description, and Register Button */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('khairatMembers')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {t('khairatMembersDescription')}
          </p>
        </div>
        {!mosqueLoading && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {t('registerNewMember')}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                {t('registerDialog.registerSingleMember') || 'Register Single Member'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBulkUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                {t('bulkUpload.bulkUploadMembers') || 'Bulk Upload Members'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {mosqueLoading ? (
        <PageLoading />
      ) : mosqueId ? (
        <KhairatManagement 
          mosqueId={mosqueId} 
          createDialogOpen={createDialogOpen}
          onCreateDialogChange={setCreateDialogOpen}
          bulkUploadDialogOpen={bulkUploadDialogOpen}
          onBulkUploadDialogChange={setBulkUploadDialogOpen}
        />
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t('noMosqueAssociated')}</p>
        </div>
      )}
    </div>
  );
}

export default function KhairatMembersPage() {
  const t = useTranslations('khairatManagement');
  
  return (
    <ProtectedRoute>
      <DashboardLayout title={t('khairatMembers')}>
        <KhairatMembersContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

