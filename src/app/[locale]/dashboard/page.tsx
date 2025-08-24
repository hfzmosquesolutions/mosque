'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  Heart,
  Users,
  Shield,
  ArrowRight,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  TrendingUp,
  Activity,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useTranslations } from 'next-intl';
import { useOnboardingRedirect } from '@/hooks/useOnboardingStatus';
import { useUserRole } from '@/hooks/useUserRole';
import { getUserFollowStats } from '@/lib/api/following';
import { getMosqueFollowerCount, getMosqueKhairatContributions } from '@/lib/api';
import { getMembershipStatistics } from '@/lib/api/kariah-memberships';
import { NotificationCard } from '@/components/dashboard/NotificationCard';

interface Contribution {
  id: string;
  amount: number;
  contributed_at: string;
  program: {
    name: string;
  };
}

interface Stats {
  active_members: number;
  total_khairat_amount: number;
}

function DashboardContent() {
  const { user, loading: userLoading } = useAuth();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [allContributions, setAllContributions] = useState<Contribution[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [membershipStats, setMembershipStats] = useState<any>(null);
  const [mosqueName, setMosqueName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const { isCompleted, isLoading: onboardingLoading } = useOnboardingRedirect();
  const { isAdmin, mosqueId, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!onboardingLoading && !roleLoading && isCompleted && user) {
      fetchDashboardData();
    }
  }, [user, onboardingLoading, roleLoading, isCompleted, isAdmin, mosqueId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('full_name, role')
        .eq('id', user?.id)
        .single();

      if (!profileError && profileData) {
        setUserProfile(profileData);
      }

      // Fetch user's contributions
      const { data: contributionsData, error: contributionsError } =
        await supabase
          .from('contributions')
          .select(
            `
            *,
            program:contribution_programs(
              *,
              mosque:mosques(
                id,
                name,
                address
              )
            )
          `
          )
          .eq('contributor_id', user?.id)
          .order('contributed_at', { ascending: false })
          .limit(10);

      if (contributionsError) {
        console.error('Error fetching contributions:', contributionsError);
      } else {
        const formattedContributions =
          contributionsData?.map((item: any) => ({
            id: item.id,
            amount: item.amount,
            contributed_at: item.contributed_at,
            program: {
              name: item.program?.name || t('unknownProgram'),
            },
          })) || [];
        setContributions(formattedContributions);
      }

      // Fetch mosque-wide contributions for admin users
      if (isAdmin && mosqueId) {
        try {
          const mosqueContributions = await getMosqueKhairatContributions(mosqueId);
          setAllContributions(mosqueContributions.data || []);
        } catch (error) {
          console.error('Error fetching mosque contributions:', error);
          setAllContributions([]);
        }
      }

      // Fetch community stats
      const { data: statsData, error: statsError } = await supabase.rpc(
        'get_community_stats'
      );

      if (statsError) {
        console.error('Error fetching stats:', statsError);
      } else {
        setStats(statsData);
      }

      // Fetch follower count based on user role
      try {
        if (isAdmin && mosqueId) {
          // For admin users, get mosque follower count
          const mosqueFollowerCount = await getMosqueFollowerCount(mosqueId);
          setFollowerCount(mosqueFollowerCount);
          
          // Fetch mosque name for admin users
          try {
            const { data: mosqueData, error: mosqueError } = await supabase
              .from('mosques')
              .select('name')
              .eq('id', mosqueId)
              .single();
            
            if (!mosqueError && mosqueData) {
              setMosqueName(mosqueData.name);
            }
          } catch (mosqueError) {
            console.error('Error fetching mosque name:', mosqueError);
          }
          
          // Fetch membership statistics for admin users
          try {
            const membershipData = await getMembershipStatistics(mosqueId);
            setMembershipStats(membershipData);
          } catch (membershipError) {
            console.error('Error fetching membership statistics:', membershipError);
            setMembershipStats(null);
          }
        } else if (user?.id) {
          // For normal users, get user follower count
          const userStats = await getUserFollowStats(user.id);
          setFollowerCount(userStats.followers_count);
        }
      } catch (followerError) {
        console.error('Error fetching follower count:', followerError);
        setFollowerCount(0);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalContributed = (isAdmin ? allContributions : contributions).reduce(
    (sum, contribution) => sum + contribution.amount,
    0
  );
  const recentContributions = isAdmin ? allContributions.slice(0, 5) : contributions.slice(0, 5);

  if (onboardingLoading || !isCompleted) {
    return null;
  }

  if (userLoading || loading || roleLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('welcome')}, {userProfile?.full_name || user?.email}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {userProfile?.role === 'admin' 
                ? mosqueName 
                  ? `Administrator for ${mosqueName}`
                  : t('adminRole')
                : t('memberRole')
              }
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('totalContributed')}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                RM {totalContributed.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? 'Total payments from all users' : t('totalPaymentsMade')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('followers')}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {followerCount}
              </div>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? t('mosqueFollowers') : t('peopleFollowingYou')}
              </p>
            </CardContent>
          </Card>

          {!isAdmin && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('myDependents')}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {/* This would need to be fetched from dependents */}0
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('familyMembersAdded')}
                </p>
              </CardContent>
            </Card>
          )}

          {isAdmin && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Kariah Members
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {membershipStats?.total || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Registered kariah members
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('recentPayments')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {recentContributions.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? 'Latest khairat payments' : t('yourLatestKhairatPayments')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Recent Payments */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-emerald-600" />
                  {t('recentPayments')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentContributions.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {t('noPaymentsYet')}
                    </p>
                    <Link href="khairat">
                      <Button>
                        <Heart className="mr-2 h-4 w-4" />
                        {t('makeYourFirstPayment')}
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
                                {isAdmin 
                                  ? (contribution as any).contributor?.full_name || 'Anonymous'
                                  : new Date(
                                      contribution.contributed_at
                                    ).toLocaleDateString()
                                }
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
                        <Link href="khairat">
                          <Button variant="outline" size="sm">
                            {t('viewAllPayments')}
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
                  {t('quickActions')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="khairat">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    <span className="flex items-center gap-2">
                      <Heart className="h-3 w-3" />
                      {t('khairatPrograms')}
                    </span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
                <Link href="profile">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between hover:bg-blue-50 hover:text-blue-700"
                  >
                    <span className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      {t('myProfile')}
                    </span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
                {!isAdmin && (
                  <Link href="dependents">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between hover:bg-orange-50 hover:text-orange-700"
                    >
                      <span className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        {t('myDependents')}
                      </span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Notifications */}
            <NotificationCard />
          </div>
        </div>
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
