'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation, useGreeting } from '@/hooks/useTranslation';
import { User } from '@/types/legacy';
import { WelcomeNotification } from './WelcomeNotification';
import { ProfileCompletionCard } from './ProfileCompletionCard';
import { AdminDashboardView } from './AdminDashboardView';
import { MemberDashboardView } from './MemberDashboardView';
import { useDashboard } from '@/hooks/useDashboard';

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  const t = useTranslation();
  const getGreeting = useGreeting();
  const {
    adminStats,
    memberStats,
    recentActivities,
    loading,
    error,
    isAdmin,
    isMember,
    refreshData,
  } = useDashboard();

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <WelcomeNotification />

        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-2">{getGreeting(user.name)}</h1>
          <p className="text-blue-100 text-lg">
            {t('auth.welcomeTo')} {t('auth.digitalMosqueSystem')}
            {user.mosqueName && ` - ${user.mosqueName}`}
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">{t('common.loading')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <WelcomeNotification />

        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-2">{getGreeting(user.name)}</h1>
          <p className="text-blue-100 text-lg">
            {t('auth.welcomeTo')} {t('auth.digitalMosqueSystem')}
            {user.mosqueName && ` - ${user.mosqueName}`}
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={refreshData}
                className="text-blue-600 hover:text-blue-700"
              >
                {t('common.retry')}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Notification for new users */}
      <WelcomeNotification />

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-2">{getGreeting(user.name)}</h1>
        <p className="text-blue-100 text-lg">
          {t('auth.welcomeTo')} {t('auth.digitalMosqueSystem')}
          {user.mosqueName && ` - ${user.mosqueName}`}
        </p>
      </div>

      {/* Role-specific Dashboard Views */}
      {isAdmin && adminStats && (
        <AdminDashboardView
          stats={adminStats}
          activities={recentActivities}
          refreshData={refreshData}
        />
      )}

      {isMember && memberStats && (
        <MemberDashboardView
          stats={memberStats}
          activities={recentActivities}
          refreshData={refreshData}
        />
      )}

      {/* Profile Completion Card - for new users */}
      <ProfileCompletionCard />
    </div>
  );
}
