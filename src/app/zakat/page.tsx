'use client';

import { useState } from 'react';
import { ZakatDashboard } from '@/components/zakat/ZakatDashboard';
import { ZakatRecordForm } from '@/components/zakat/ZakatRecordForm';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useAuthState } from '@/hooks/useAuth.v2';
import { createUserFromAuth } from '@/utils/userUtils';

export default function ZakatPage() {
  const { user: authUser, profile } = useAuthState();
  const [currentView, setCurrentView] = useState<
    'dashboard' | 'add-record' | 'edit-record'
  >('dashboard');
  const [editingRecord, setEditingRecord] = useState<any>(null);

  if (!authUser || !profile) {
    return <AuthLayout>Access denied</AuthLayout>;
  }

  const user = createUserFromAuth(authUser, profile);

  const handleAddRecord = () => {
    setEditingRecord(null);
    setCurrentView('add-record');
  };

  const handleEditRecord = (record: any) => {
    setEditingRecord(record);
    setCurrentView('edit-record');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setEditingRecord(null);
  };

  const handleSaveRecord = (record: any) => {
    // Handle the save logic here
    console.log('Saving record:', record);
    handleBackToDashboard();
  };

  if (!user) return null;

  return (
    <AuthLayout>
      {currentView === 'dashboard' && (
        <ZakatDashboard
          user={user}
          onAddRecord={handleAddRecord}
          onEditRecord={handleEditRecord}
        />
      )}
      {(currentView === 'add-record' || currentView === 'edit-record') && (
        <ZakatRecordForm
          record={editingRecord}
          onSave={handleSaveRecord}
          onCancel={handleBackToDashboard}
        />
      )}
    </AuthLayout>
  );
}
