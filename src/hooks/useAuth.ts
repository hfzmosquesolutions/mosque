'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'mosque_admin' | 'ajk' | 'member';
  permissions: string[];
  mosqueName?: string;
}

export function useAuth(requireAuth: boolean = true) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();

  // Load user from localStorage on mount (client-side only)
  useEffect(() => {
    setIsHydrated(true);
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle redirection after loading is complete and hydration is done
  useEffect(() => {
    if (isHydrated && !isLoading && requireAuth && !user) {
      router.push('/');
    }
  }, [isHydrated, isLoading, user, requireAuth, router]);

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Error removing user from localStorage:', error);
    }
    router.push('/');
  };

  return {
    user,
    isLoading,
    logout,
    isAuthenticated: !!user,
  };
}
