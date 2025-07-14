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
  FileText,
  DollarSign,
  HandCoins,
  Calendar,
  Calculator,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation, useCurrency } from '@/hooks/useTranslation';
import { MemberDashboardStats, DashboardActivity } from '@/hooks/useDashboard';

interface MemberDashboardViewProps {
  stats: MemberDashboardStats;
  activities: DashboardActivity[];
  refreshData: () => void;
}

export function MemberDashboardView({
  stats,
  activities,
  refreshData,
}: MemberDashboardViewProps) {
  const t = useTranslation();
  const formatCurrency = useCurrency();
  const router = useRouter();

  const quickActions = [
    {
      label: t('khairat.addRecord'),
      icon: Plus,
      action: () => router.push('/khairat?action=add'),
      color: 'text-purple-600 hover:text-purple-700',
    },
    {
      label: t('zakat.calculate'),
      icon: Calculator,
      action: () => router.push('/zakat'),
      color: 'text-green-600 hover:text-green-700',
    },
    {
      label: t('programs.view'),
      icon: Calendar,
      action: () => router.push('/programs'),
      color: 'text-orange-600 hover:text-orange-700',
    },
    {
      label: t('profile.view'),
      icon: Eye,
      action: () => router.push('/account'),
      color: 'text-blue-600 hover:text-blue-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Personal Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('khairat.myRecords')}
            </CardTitle>
            <FileText className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.myKhairatRecords}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('khairat.totalSubmitted')}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('khairat.myContributions')}
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(stats.myTotalContributions)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('khairat.totalContributed')}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('programs.upcoming')}
            </CardTitle>
            <Calendar className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.myUpcomingPrograms}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('programs.registered')}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('zakat.calculations')}
            </CardTitle>
            <Calculator className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.myZakatCalculations}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('zakat.calculated')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions')}</CardTitle>
            <CardDescription>{t('dashboard.commonTasks')}</CardDescription>
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

        {/* My Recent Activities */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('dashboard.myRecentActivities')}</CardTitle>
              <CardDescription>
                {t('dashboard.yourLatestActions')}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={refreshData}>
              <Eye className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm mb-4">
                    {t('dashboard.noRecentActivities')}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => router.push('/khairat?action=add')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('khairat.addFirstRecord')}
                  </Button>
                </div>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {activity.type === 'payment' && (
                        <DollarSign className="h-5 w-5 text-green-500" />
                      )}
                      {activity.type === 'khairat' && (
                        <HandCoins className="h-5 w-5 text-purple-500" />
                      )}
                      {activity.type === 'program' && (
                        <Calendar className="h-5 w-5 text-orange-500" />
                      )}
                      {activity.type === 'zakat' && (
                        <Calculator className="h-5 w-5 text-green-500" />
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

      {/* Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Khairat Status */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HandCoins className="h-5 w-5 text-purple-500" />
              {t('khairat.status')}
            </CardTitle>
            <CardDescription>{t('khairat.yourSubmissions')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.myPendingRecords > 0 && (
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-yellow-800">
                      {stats.myPendingRecords} {t('khairat.pendingApproval')}
                    </p>
                    <p className="text-xs text-yellow-600">
                      {t('khairat.beingReviewed')}
                    </p>
                  </div>
                </div>
              )}

              {stats.myKhairatRecords > 0 && (
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800">
                      {formatCurrency(stats.myTotalContributions)}{' '}
                      {t('khairat.totalContributed')}
                    </p>
                    <p className="text-xs text-green-600">
                      {stats.myKhairatRecords} {t('khairat.recordsSubmitted')}
                    </p>
                  </div>
                </div>
              )}

              {stats.myKhairatRecords === 0 && (
                <div className="text-center py-6">
                  <HandCoins className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm mb-4">
                    {t('khairat.noRecordsYet')}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => router.push('/khairat?action=add')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('khairat.addFirstRecord')}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Programs Status */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              {t('programs.myPrograms')}
            </CardTitle>
            <CardDescription>
              {t('programs.registrationsAndSchedule')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.myUpcomingPrograms > 0 ? (
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-800">
                      {stats.myUpcomingPrograms}{' '}
                      {t('programs.upcomingPrograms')}
                    </p>
                    <p className="text-xs text-blue-600">
                      {t('programs.dontMissOut')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/programs')}
                  >
                    {t('programs.view')}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm mb-4">
                    {t('programs.noProgramsRegistered')}
                  </p>
                  <Button size="sm" onClick={() => router.push('/programs')}>
                    <Eye className="h-4 w-4 mr-2" />
                    {t('programs.browsePrograms')}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
