'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  DollarSign,
  Heart,
  HandCoins,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useTranslation,
  useCurrency,
  useGreeting,
} from '@/hooks/useTranslation';
import { User } from '../MosqueApp';

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  const t = useTranslation();
  const formatCurrency = useCurrency();
  const getGreeting = useGreeting();

  // Mock data - in real app, this would come from API
  const stats = {
    totalMembers: 847,
    monthlyCollection: 18750,
    activePrograms: 12,
    khairatMembers: 523,
    zakatCollected: 45600,
    pendingApplications: 8,
  };

  const recentActivities = [
    {
      id: 1,
      type: 'payment',
      message: 'Yuran bulanan diterima dari Ahmad Ali',
      time: '2 jam lalu',
    },
    {
      id: 2,
      type: 'member',
      message: 'Ahli baru didaftarkan: Fatimah Zahra',
      time: '4 jam lalu',
    },
    {
      id: 3,
      type: 'khairat',
      message: 'Permohonan khairat diluluskan',
      time: '1 hari lalu',
    },
    {
      id: 4,
      type: 'zakat',
      message: 'Zakat harta dikira: RM 1,250',
      time: '2 hari lalu',
    },
  ];

  const quickActions = [
    { label: 'Daftar Ahli Baru', icon: Users, action: () => {} },
    { label: 'Rekod Pembayaran', icon: DollarSign, action: () => {} },
    { label: 'Kira Zakat', icon: HandCoins, action: () => {} },
    { label: 'Jadual Program', icon: Calendar, action: () => {} },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-2">{getGreeting(user.name)}</h1>
        <p className="text-blue-100 text-lg">
          {t('auth.welcomeTo')} {t('auth.digitalMosqueSystem')}
          {user.mosqueName && ` - ${user.mosqueName}`}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('dashboard.totalMembers')}
            </CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.totalMembers}
            </div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12% {t('dashboard.lastMonth')}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('dashboard.monthlyIncome')}
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(stats.monthlyCollection)}
            </div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8% {t('dashboard.lastMonth')}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('navigation.khairat')} {t('members.members')}
            </CardTitle>
            <Heart className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.khairatMembers}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {((stats.khairatMembers / stats.totalMembers) * 100).toFixed(1)}%
              {t('dashboard.totalMembers')}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Zakat Terkumpul
            </CardTitle>
            <HandCoins className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              RM {stats.zakatCollected.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Tahun 2024</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Tindakan Pantas</CardTitle>
            <CardDescription>
              Akses pantas kepada fungsi yang kerap digunakan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-16 flex flex-col gap-2 hover:bg-gray-50 transition-colors"
                    onClick={action.action}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs text-center leading-tight">
                      {action.label}
                    </span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Aktiviti Terkini</CardTitle>
            <CardDescription>Aktiviti terbaru dalam sistem</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {activity.type === 'payment' && (
                      <DollarSign className="h-5 w-5 text-green-500" />
                    )}
                    {activity.type === 'member' && (
                      <Users className="h-5 w-5 text-blue-500" />
                    )}
                    {activity.type === 'khairat' && (
                      <Heart className="h-5 w-5 text-red-500" />
                    )}
                    {activity.type === 'zakat' && (
                      <HandCoins className="h-5 w-5 text-purple-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 leading-relaxed">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts/Notifications */}
      {user.role !== 'member' && (
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Pemberitahuan</CardTitle>
            <CardDescription>Perkara yang memerlukan perhatian</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-yellow-800">
                    {stats.pendingApplications} permohonan menunggu kelulusan
                  </p>
                  <p className="text-xs text-yellow-600">
                    Termasuk permohonan khairat dan zakat
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-800">
                    Sistem berjalan normal
                  </p>
                  <p className="text-xs text-green-600">
                    Semua modul berfungsi dengan baik
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
