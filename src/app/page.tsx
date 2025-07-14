'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/useAuth.v2';
import '@/utils/translationChecker'; // Auto-check translations in development

export default function Home() {
  const { user, isLoading } = useAuthState();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Redirect authenticated users to dashboard
        router.push('/dashboard');
      } else {
        // Redirect unauthenticated users to public landing page
        router.push('/public');
      }
    }
  }, [user, isLoading, router]);

  // Show loading while checking authentication
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
