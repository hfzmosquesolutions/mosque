'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useOnboardingRedirect } from '@/hooks/useOnboardingStatus';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  Building,
  Shield,
  Settings,
  ArrowRight,
  Calendar,
  Users,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { getDashboardStats, getUserKhairatContributions } from '@/lib/api';
import {
  DashboardStats,
  KhairatContribution,
  KhairatProgram,
  Mosque,
} from '@/types/database';
import { EnhancedStatsCards } from '@/components/dashboard/EnhancedStatsCards';
import { QuickInsights } from '@/components/dashboard/QuickInsights';
import { EnhancedRecentActivity } from '@/components/dashboard/EnhancedRecentActivity';

function DashboardContent() {
  const { user } = useAuth();
  const { isCompleted, isLoading } = useOnboardingRedirect();
  const {
    profile,
    isAdmin,
    isMosqueOwner,
    mosqueId,
    loading: roleLoading,
  } = useUserRole();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentContributions, setRecentContributions] = useState<
    (KhairatContribution & { program: KhairatProgram & { mosque: Mosque } })[]
  >([]);
  // Removed upcomingEvents as it's not used in the enhanced dashboard

  const [, setDataLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    async function fetchDashboardData() {
      if (!user?.id || !isCompleted) return;

      try {
        setDataLoading(true);

        // Fetch user khairat contributions
        const contributionsResult = await getUserKhairatContributions(
          user.id,
          5
        );
        if (contributionsResult.data) {
          setRecentContributions(contributionsResult.data);
        }

        // If user is admin and has mosque, fetch mosque stats
        if (isAdmin && mosqueId) {
          const statsResult = await getDashboardStats(mosqueId);
          if (statsResult.success && statsResult.data) {
            setStats(statsResult.data);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setDataLoading(false);
      }
    }

    fetchDashboardData();
  }, [user?.id, isCompleted, isAdmin, mosqueId]);

  // Show loading while checking onboarding status
  if (isLoading || roleLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Don't render dashboard content if onboarding is not completed
  if (!isCompleted) {
    return null;
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-2xl" />
          <div className="relative p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <p className="text-muted-foreground text-lg">
                  {isAdmin
                    ? 'Manage your mosque dashboard and khairat programs'
                    : 'Access your mosque community dashboard'}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={isAdmin ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {isAdmin ? 'Admin' : 'Member'}
                    </Badge>
                    {isMosqueOwner && (
                      <Badge
                        variant="outline"
                        className="text-xs text-green-600 border-green-600"
                      >
                        Owner
                      </Badge>
                    )}
                  </div>
                  <span>
                    Welcome,{' '}
                    {profile?.full_name?.split(' ')[0] ||
                      user?.email?.split('@')[0]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        {isAdmin && stats && (
          <div className="space-y-6">
            {/* Stats Cards - Full Width */}
            <EnhancedStatsCards stats={stats} />

            {/* Second Row - Quick Insights and Activity */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column - Quick Insights */}
              <div className="lg:col-span-2">
                <QuickInsights stats={stats} />
              </div>

              {/* Right Column - Recent Activity & Quick Actions */}
              <div className="space-y-6">
                <EnhancedRecentActivity stats={stats} />

                {/* Quick Actions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Shield className="h-4 w-4 text-green-600" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Link href="/khairat">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between hover:bg-green-50 hover:text-green-700"
                      >
                        <span className="flex items-center gap-2">
                          <Heart className="h-3 w-3" />
                          Khairat
                        </span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                    <Link href="/mosque-profile">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between hover:bg-blue-50 hover:text-blue-700"
                      >
                        <span className="flex items-center gap-2">
                          <Building className="h-3 w-3" />
                          Profile
                        </span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                    <Link href="/settings">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between hover:bg-gray-50 hover:text-gray-700"
                      >
                        <span className="flex items-center gap-2">
                          <Settings className="h-3 w-3" />
                          Settings
                        </span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Non-admin view - Enhanced Dashboard */}
        {!isAdmin && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    My Payments
                  </CardTitle>
                  <Heart className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {recentContributions.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total payments made
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Programs
                  </CardTitle>
                  <Building className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">
                    Programs you can join
                  </p>
                </CardContent>
              </Card>

              <Link href="/dependents">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      My Dependents
                    </CardTitle>
                    <Users className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      Family members added
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column - Recent Activity */}
              <div className="lg:col-span-2 space-y-6">
                {/* Recent Payments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-emerald-600" />
                      Recent Payments
                    </CardTitle>
                    <CardDescription>
                      Your latest khairat payments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentContributions.length === 0 ? (
                      <div className="text-center py-8">
                        <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          No payments yet
                        </p>
                        <Link href="/khairat">
                          <Button>
                            <Heart className="mr-2 h-4 w-4" />
                            Make Your First Payment
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentContributions
                          .slice(0, 3)
                          .map((contribution, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                  <Heart className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">
                                    {contribution.program.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(
                                      contribution.contributed_at
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-emerald-600">
                                  RM {contribution.amount}
                                </p>
                              </div>
                            </div>
                          ))}
                        {recentContributions.length > 3 && (
                          <div className="text-center pt-2">
                            <Link href="/khairat">
                              <Button variant="outline" size="sm">
                                View All Payments
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Quick Actions & Info */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Shield className="h-4 w-4 text-green-600" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Link href="/khairat">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        <span className="flex items-center gap-2">
                          <Heart className="h-3 w-3" />
                          Khairat Programs
                        </span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                    <Link href="/dependents">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between hover:bg-orange-50 hover:text-orange-700"
                      >
                        <span className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          My Dependents
                        </span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                    <Link href="/profile">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between hover:bg-blue-50 hover:text-blue-700"
                      >
                        <span className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          My Profile
                        </span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                    <Link href="/dependents">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between hover:bg-orange-50 hover:text-orange-700"
                      >
                        <span className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          My Dependents
                        </span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Community Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="h-4 w-4 text-blue-600" />
                      Community
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {stats ? (
                      <>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {stats.active_members}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Active Members
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-emerald-600">
                            RM {stats.total_khairat_amount.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Total Payments
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            0
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Active Members
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-emerald-600">
                            RM 0
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Total Payments
                          </div>
                        </div>
                      </>
                    )}
                    <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        Join our growing community
                      </p>
                      <Link href="/mosques">
                        <Button variant="outline" size="sm" className="w-full">
                          Explore Mosques
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
