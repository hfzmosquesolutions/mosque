'use client';

import { useEffect, useState, useCallback } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
  Heart,
  Target,
  Plus,
  Activity,
  ArrowUpRight,
  DollarSign,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAdminAccess, useUserMosque } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { ContributionForm } from '@/components/contributions/ContributionForm';
import { ContributionsTabContent } from '@/components/contributions/ContributionsTabContent';
import { UserPaymentsTable } from '@/components/contributions/UserPaymentsTable';
import { getUserContributions, getContributionPrograms } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type {
  Contribution,
  ContributionProgram,
  Mosque,
} from '@/types/database';

function KhairatContent() {
  const { user } = useAuth();
  const { hasAdminAccess } = useAdminAccess();
  const { mosqueId } = useUserMosque();
  const [userContributions, setUserContributions] = useState<
    (Contribution & { program: ContributionProgram & { mosque: Mosque } })[]
  >([]);
  const [programs, setPrograms] = useState<ContributionProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const contributionsResult = await getUserContributions(user.id);
      setUserContributions(
        (contributionsResult.data || []).filter(
          (c) => c.program?.program_type === 'khairat'
        )
      );

      if (mosqueId) {
        const programsResult = await getContributionPrograms(
          mosqueId,
          'khairat'
        );
        if (programsResult.success && programsResult.data) {
          setPrograms(programsResult.data);
        }
      } else {
        setPrograms([]);
      }
    } catch (error) {
      console.error('Error fetching khairat data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, mosqueId]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading khairat data...</p>
        </div>
      </div>
    );
  }

  const totalContributed = userContributions.reduce(
    (sum, contribution) => sum + contribution.amount,
    0
  );
  const activePrograms = programs.filter((p) => p.is_active).length;
  const recentContributions = userContributions.slice(0, 5);
  const averageContribution =
    userContributions.length > 0
      ? totalContributed / userContributions.length
      : 0;
  const programsSupported = new Set(userContributions.map((c) => c.program_id))
    .size;

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-2xl" />
        <div className="relative p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <p className="text-muted-foreground text-lg">
                {hasAdminAccess
                  ? 'Manage khairat programs and track payments'
                  : 'Contribute to khairat initiatives in your community'}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  <span>{userContributions.length} payments made</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  <span>{activePrograms} active programs</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setIsContributionModalOpen(true)}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="mr-2 h-5 w-5" />
              Make Payment
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* Enhanced Header */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Khairat Overview
                </h2>
                <p className="text-muted-foreground mt-1">
                  Your payment summary and recent khairat activity
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Summary Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Contributed
                </CardTitle>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  RM {totalContributed.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Across {userContributions.length} payments
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Recent Activity
                </CardTitle>
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <ArrowUpRight className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {Math.min(recentContributions.length, 3)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Recent payments
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Payment
                </CardTitle>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  RM{' '}
                  {averageContribution.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Per payment
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Programs Supported
                </CardTitle>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {programsSupported}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Different programs
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-slate-900 dark:text-slate-100">
                      Khairat Programs
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Support welfare initiatives
                    </CardDescription>
                  </div>
                  {programs.filter((p) => p.is_active).length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {programs.filter((p) => p.is_active).length} active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {programs.filter((p) => p.is_active).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Target className="h-8 w-8 text-muted-foreground mb-3" />
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                      No Active Khairat Programs
                    </h3>
                    <p className="text-muted-foreground text-center text-xs">
                      Check back later for new programs.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {programs
                      .filter((p) => p.is_active)
                      .slice(0, 3)
                      .map((program) => {
                        const progressPercentage = program.target_amount
                          ? Math.min(
                              (program.current_amount / program.target_amount) *
                                100,
                              100
                            )
                          : 0;
                        return (
                          <div
                            key={program.id}
                            className="group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all duration-200 p-3 rounded-lg border border-gray-100 dark:border-gray-800"
                            onClick={() => setIsContributionModalOpen(true)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-semibold text-sm group-hover:text-emerald-600 transition-colors truncate">
                                    {program.name}
                                  </h3>
                                  <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-emerald-600 transition-colors ml-2 flex-shrink-0" />
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-bold text-emerald-600">
                                    RM {program.current_amount.toLocaleString()}
                                  </span>
                                  {program.target_amount ? (
                                    <span className="text-xs text-muted-foreground">
                                      of RM{' '}
                                      {program.target_amount.toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-blue-600 font-medium">
                                      Ongoing
                                    </span>
                                  )}
                                </div>
                                {program.target_amount ? (
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                      <div
                                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-1.5 rounded-full transition-all duration-500"
                                        style={{
                                          width: `${progressPercentage}%`,
                                        }}
                                      ></div>
                                    </div>
                                    <span className="text-xs font-medium text-emerald-600 flex-shrink-0">
                                      {Math.round(progressPercentage)}%
                                    </span>
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground">
                                    No target amount set
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-slate-900 dark:text-slate-100">
                      Recent Payments
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Your latest khairat activity
                    </CardDescription>
                  </div>
                  {recentContributions.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {Math.min(recentContributions.length, 3)} recent
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {recentContributions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Heart className="h-8 w-8 text-muted-foreground mb-3" />
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                      No Payments Yet
                    </h3>
                    <p className="text-muted-foreground text-center text-xs mb-3">
                      Start making payments to support khairat programs.
                    </p>
                    <Button
                      onClick={() => setIsContributionModalOpen(true)}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Make Payment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentContributions.slice(0, 3).map((contribution) => (
                      <div
                        key={contribution.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {contribution.program?.name || 'Program'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {contribution.program?.mosque?.name || ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground">
                            {new Date(
                              contribution.contributed_at
                            ).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            RM {contribution.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          {hasAdminAccess ? (
            <ContributionsTabContent programs={programs} />
          ) : (
            <UserPaymentsTable contributions={userContributions} />
          )}
        </TabsContent>
      </Tabs>

      <ContributionForm
        isOpen={isContributionModalOpen}
        onClose={() => setIsContributionModalOpen(false)}
        defaultProgramType="khairat"
      />
    </div>
  );
}

export default function KhairatPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout title="Khairat">
        <KhairatContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
