'use client';

import { useAuthState } from '@/hooks/useAuth.v2';
import { redirect } from 'next/navigation';
import UserSubmissionsDashboard from '@/components/user/UserSubmissionsDashboard';

export default function MySubmissionsPage() {
  const { user, isLoading } = useAuthState();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <UserSubmissionsDashboard />
      </div>
    </div>
  );
}
