'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginPage } from '@/components/auth/LoginPage';
import '@/utils/translationChecker'; // Auto-check translations in development

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      router.push('/dashboard'); // Redirect to dashboard if already logged in
    }
    setIsLoading(false);
  }, [router]);

  const handleLogin = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Mock login for now - simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock successful login with more realistic user data
      let mockUser;

      if (email === 'superadmin@masjid.gov.my') {
        mockUser = {
          id: '1',
          name: 'Ahmad Superadmin',
          email: email,
          role: 'super_admin',
          permissions: ['all'],
          mosqueName: 'Sistem Pengurusan Masjid Digital',
        };
      } else if (email === 'admin@masjidalnur.my') {
        mockUser = {
          id: '2',
          name: 'Ustaz Abdullah',
          email: email,
          role: 'mosque_admin',
          mosqueId: 'masjid_1',
          mosqueName: 'Masjid Al-Hidayah',
          permissions: [
            'manage_members',
            'manage_finance',
            'manage_programs',
            'manage_khairat',
            'manage_zakat',
            'view_reports',
          ],
        };
      } else {
        mockUser = {
          id: '4',
          name: 'Ali Ahmad',
          email: email,
          role: 'member',
          mosqueId: 'masjid_1',
          mosqueName: 'Masjid Al-Hidayah',
          permissions: ['view_profile', 'make_payments', 'calculate_zakat'],
        };
      }

      // Save user to localStorage
      localStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);

      // Redirect to dashboard
      router.push('/dashboard');

      return true;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, they will be redirected to dashboard
  // This component only shows login page
  return <LoginPage onLogin={handleLogin} isLoading={isLoading} />;
}
