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
  HandCoins,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  FileText,
  Clock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation, useCurrency } from '@/hooks/useTranslation';
import { DashboardStats, DashboardActivity } from '@/hooks/useDashboard';

interface AdminDashboardViewProps {
  stats: DashboardStats;
  activities: DashboardActivity[];
  refreshData: () => void;
}

export function AdminDashboardView({
  stats,
  activities,
  refreshData,
}: AdminDashboardViewProps) {
  const t = useTranslation();
  const formatCurrency = useCurrency();
  const router = useRouter();

  const quickActions = [
    {
      label: t('dashboard.addNewMember'),
      icon: Users,
      action: () => router.push('/members?action=add'),
      color: 'text-blue-600 hover:text-blue-700',
    },
    {
      label: t('dashboard.recordPayment'),
      icon: DollarSign,
      action: () => router.push('/finance?action=add'),
      color: 'text-green-600 hover:text-green-700',
    },
    {
      label: t('dashboard.khairatManagement'),
      icon: HandCoins,
      action: () => router.push('/khairat'),
      color: 'text-purple-600 hover:text-purple-700',
    },
    {
      label: t('dashboard.programSchedule'),
      icon: Calendar,
      action: () => router.push('/programs'),
      color: 'text-orange-600 hover:text-orange-700',
    },
  ];

  return (
    <div className="space-y-6">
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
            <p className="text-xs text-gray-500 mt-1">
              {t('dashboard.registeredMembers')}
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
            <p className="text-xs text-gray-500 mt-1">
              {t('dashboard.thisMonth')}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('khairat.totalAmount')}
            </CardTitle>
            <HandCoins className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(stats.khairatStats.totalAmount)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.khairatStats.totalRecords} {t('khairat.records')}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('dashboard.activePrograms')}
            </CardTitle>
            <Calendar className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.activePrograms}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('dashboard.runningPrograms')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions')}</CardTitle>
            <CardDescription>
              {t('dashboard.frequentlyUsedFunctions')}
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
                    className="h-16 flex flex-col gap-2 hover:bg-gray-50 transition-colors group"
                    onClick={action.action}
                  >
                    <Icon
                      className={`h-5 w-5 ${action.color} group-hover:scale-110 transition-transform`}
                    />
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('dashboard.recentActivities')}</CardTitle>
              <CardDescription>
                {t('dashboard.latestSystemActivities')}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={refreshData}>
              <TrendingUp className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">
                    {t('dashboard.noRecentActivities')}
                  </p>
                </div>
              ) : (
                activities.map((activity) => (
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
                      {activity.type === 'zakat' && (
                        <HandCoins className="h-5 w-5 text-purple-500" />
                      )}
                      {activity.type === 'khairat' && (
                        <FileText className="h-5 w-5 text-indigo-500" />
                      )}
                      {activity.type === 'program' && (
                        <Calendar className="h-5 w-5 text-orange-500" />
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
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts/Notifications */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>{t('dashboard.notifications')}</CardTitle>
          <CardDescription>
            {t('dashboard.itemsRequiringAttention')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.pendingApplications > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-yellow-800">
                    {stats.pendingApplications}{' '}
                    {t('dashboard.pendingApplications')}
                  </p>
                  <p className="text-xs text-yellow-600">
                    {t('dashboard.includesZakatAndPrograms')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/khairat')}
                >
                  {t('dashboard.review')}
                </Button>
              </div>
            )}

            {stats.khairatStats.pendingRecords > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-800">
                    {stats.khairatStats.pendingRecords}{' '}
                    {t('khairat.pendingRecords')}
                  </p>
                  <p className="text-xs text-blue-600">
                    {t('khairat.awaitingApproval')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/khairat')}
                >
                  {t('dashboard.manage')}
                </Button>
              </div>
            )}

            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800">
                  {t('dashboard.systemRunningNormally')}
                </p>
                <p className="text-xs text-green-600">
                  {t('dashboard.allModulesFunctioning')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
