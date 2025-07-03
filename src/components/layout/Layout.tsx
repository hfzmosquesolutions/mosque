'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Home,
  Users,
  DollarSign,
  Heart,
  HandCoins,
  FileText,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Building,
  CalendarCheck,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'mosque_admin' | 'ajk' | 'member';
  permissions: string[];
  mosqueName?: string;
}

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

// Memoize the Layout to prevent unnecessary re-renders when user or children don't change
export const Layout = memo(function Layout({
  user,
  onLogout,
  children,
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  // Memoize navigation items to prevent recalculation on every render
  const navigationItems = useMemo(
    () => [
      {
        path: '/dashboard',
        labelKey: 'navigation.dashboard',
        icon: Home,
        roles: ['super_admin', 'mosque_admin', 'ajk', 'member'] as const,
      },
      {
        path: '/members',
        labelKey: 'navigation.members',
        icon: Users,
        roles: ['super_admin', 'mosque_admin', 'ajk'] as const,
      },
      {
        path: '/finance',
        labelKey: 'navigation.finance',
        icon: DollarSign,
        roles: ['super_admin', 'mosque_admin', 'ajk'] as const,
      },
      {
        path: '/khairat',
        labelKey: 'navigation.khairat',
        icon: Heart,
        roles: ['super_admin', 'mosque_admin', 'ajk', 'member'] as const,
      },
      {
        path: '/zakat',
        labelKey: 'navigation.zakat',
        icon: HandCoins,
        roles: ['super_admin', 'mosque_admin', 'ajk', 'member'] as const,
      },
      {
        path: '/programs',
        labelKey: 'navigation.programs',
        icon: Calendar,
        roles: ['super_admin', 'mosque_admin', 'ajk', 'member'] as const,
      },
      {
        path: '/bookings',
        labelKey: 'navigation.bookings',
        icon: CalendarCheck,
        roles: ['super_admin', 'mosque_admin', 'ajk', 'member'] as const,
      },
      {
        path: '/reports',
        labelKey: 'navigation.reports',
        icon: FileText,
        roles: ['super_admin', 'mosque_admin'] as const,
      },
      {
        path: '/account',
        labelKey: 'navigation.account',
        icon: User,
        roles: ['super_admin', 'mosque_admin', 'ajk', 'member'] as const,
      },
      {
        path: '/mosque-profile',
        labelKey: 'navigation.mosqueProfile',
        icon: Building,
        roles: ['super_admin', 'mosque_admin'] as const,
      },
    ],
    []
  );

  // Memoize filtered navigation to prevent recalculation
  const filteredNavigation = useMemo(
    () =>
      navigationItems.filter((item) =>
        (item.roles as readonly string[]).includes(user.role)
      ),
    [navigationItems, user.role]
  );

  // Memoize page title calculation
  const currentPageTitle = useMemo(() => {
    const currentPage = navigationItems.find((item) => item.path === pathname);
    return currentPage ? t(currentPage.labelKey) : t('navigation.dashboard');
  }, [navigationItems, pathname, t]);

  // Optimize navigation handler with useCallback
  const handleNavigation = useCallback(
    (path: string) => {
      router.push(path);
      setSidebarOpen(false);
    },
    [router]
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col h-screen
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:relative lg:flex lg:flex-col lg:h-screen
      `}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b bg-white">
          <div className="flex items-center space-x-3">
            <HandCoins className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Masjid Digital
              </h1>
              <p className="text-xs text-gray-500">{user.mosqueName}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-none mt-6 px-4 space-y-1 overflow-y-auto max-h-[calc(100vh-12rem)]">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                prefetch={true}
                className="block"
                onClick={() => setSidebarOpen(false)}
              >
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`w-full justify-start hover:bg-gray-50 ${
                    isActive
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {t(item.labelKey)}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="flex-shrink-0 p-4 border-t bg-gray-50 mt-auto">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-500">{t(`roles.${user.role}`)}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t('navigation.logout')}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top navigation */}
        <div className="flex items-center justify-between h-16 px-4 bg-white border-b lg:px-6 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold text-gray-900 truncate">
            {currentPageTitle}
          </h2>
          <LanguageSwitcher />
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto bg-gray-50">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
});
