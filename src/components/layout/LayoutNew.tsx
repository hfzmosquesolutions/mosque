'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Home,
  Users,
  DollarSign,
  Heart,
  HandCoins,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
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

export function Layout({ user, onLogout, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: Home,
      roles: ['super_admin', 'mosque_admin', 'ajk', 'member'],
    },
    {
      path: '/members',
      label: 'Members',
      icon: Users,
      roles: ['super_admin', 'mosque_admin', 'ajk'],
    },
    {
      path: '/finance',
      label: 'Finance',
      icon: DollarSign,
      roles: ['super_admin', 'mosque_admin', 'ajk'],
    },
    {
      path: '/khairat',
      label: 'Khairat',
      icon: Heart,
      roles: ['super_admin', 'mosque_admin', 'ajk', 'member'],
    },
    {
      path: '/zakat',
      label: 'Zakat',
      icon: HandCoins,
      roles: ['super_admin', 'mosque_admin', 'ajk', 'member'],
    },
    {
      path: '/reports',
      label: 'Reports',
      icon: FileText,
      roles: ['super_admin', 'mosque_admin'],
    },
  ];

  const filteredNavigation = navigationItems.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-gray-50">
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
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <div className="flex items-center space-x-2">
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

        <nav className="mt-8 px-4 space-y-2">
          {filteredNavigation.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                // For now, just close sidebar on mobile
                setSidebarOpen(false);
              }}
            >
              <item.icon className="h-4 w-4 mr-3" />
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">
              {user.role === 'super_admin' && 'Super Admin'}
              {user.role === 'mosque_admin' && 'Admin Masjid'}
              {user.role === 'ajk' && 'Ahli Jawatankuasa'}
              {user.role === 'member' && 'Ahli Kariah'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Keluar
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="flex items-center justify-between h-16 px-4 bg-white border-b lg:px-6">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold text-gray-900">
            {user.mosqueName || 'Sistem Pengurusan Masjid Digital'}
          </h2>
          <div className="w-8" /> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
