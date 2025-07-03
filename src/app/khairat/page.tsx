'use client';

import { useState } from 'react';
import { KhairatDashboard } from '@/components/khairat/KhairatDashboard';
import { KhairatApplicationForm } from '@/components/khairat/KhairatApplicationForm';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useAuth } from '@/hooks/useAuth';

export default function KhairatPage() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);

  const handleAddApplication = () => {
    setEditingApplication(null);
    setShowForm(true);
  };

  const handleEditApplication = (application: any) => {
    setEditingApplication(application);
    setShowForm(true);
  };

  const handleBackToList = () => {
    setShowForm(false);
    setEditingApplication(null);
  };

  const handleApplicationSubmit = (applicationData: any) => {
    // Handle the application submission
    console.log('Application submitted:', applicationData);
    handleBackToList();
  };

  return (
    <AuthLayout>
      {user && (
        <>
          {showForm ? (
            <KhairatApplicationForm
              application={editingApplication}
              onBack={handleBackToList}
              onSubmit={handleApplicationSubmit}
            />
          ) : (
            <KhairatDashboard
              user={user}
              onAddApplication={handleAddApplication}
              onEditApplication={handleEditApplication}
            />
          )}
        </>
      )}
    </AuthLayout>
  );
}
