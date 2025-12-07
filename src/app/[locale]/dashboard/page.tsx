'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard, StatsCardColors } from '@/components/ui/stats-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  ExternalLink,
  Bell,
  Building,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useTranslations } from 'next-intl';
import { useOnboardingRedirect } from '@/hooks/useOnboardingStatus';
import { useUserRole } from '@/hooks/useUserRole';
import { getMosqueKhairatContributions, getMosqueClaims, getMosque } from '@/lib/api';
import { getMembershipStatistics } from '@/lib/api/kariah-memberships';
import { getUserNotifications, markNotificationAsRead, getUnreadNotificationCount } from '@/lib/api/notifications';
import { NotificationCard } from '@/components/dashboard/NotificationCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { MemberDashboard } from '@/components/dashboard/MemberDashboard';
import { AdminGettingStarted } from '@/components/dashboard/AdminGettingStarted';


interface Contribution {
  id: string;
  amount: number;
  contributed_at: string;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  program?: {
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
  const [membershipStats, setMembershipStats] = useState<any>(null);
  const [mosqueName, setMosqueName] = useState<string>('');
  const [mosqueData, setMosqueData] = useState<any>(null);
  const [khairatClaims, setKhairatClaims] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState<number>(0);
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

  // Fetch notifications from database
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notificationsData = await getUserNotifications(1, 5);
        setNotifications(notificationsData.data);
        
        // Calculate unread count from the fetched notifications only
        const unreadCountFromFetched = notificationsData.data.filter(n => !n.is_read).length;
        setUnreadCount(unreadCountFromFetched);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('full_name, role, onboarding_completed')
        .eq('id', user?.id)
        .single();

      if (!profileError && profileData) {
        setUserProfile(profileData);
      }

      // Fetch user's contributions
      const { data: contributionsData, error: contributionsError } =
        await supabase
          .from('khairat_contributions')
          .select(
            `
            *,
            program:khairat_programs(
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
            status: item.status || 'completed',
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

      // Load mosque data and membership insights for admin users
      if (isAdmin && mosqueId) {
        // Fetch mosque data for admin users
        try {
          const mosqueResponse = await getMosque(mosqueId);
          if (mosqueResponse.success && mosqueResponse.data) {
            setMosqueData(mosqueResponse.data);
            setMosqueName(mosqueResponse.data.name);
          }
        } catch (mosqueError) {
          console.error('Error fetching mosque data:', mosqueError);
        }
        
        // Fetch membership statistics for admin users
        try {
          const membershipData = await getMembershipStatistics(mosqueId);
          setMembershipStats(membershipData);
        } catch (membershipError) {
          console.error('Error fetching membership statistics:', membershipError);
          setMembershipStats(null);
        }

        // Fetch pending membership applications count for admin users
        try {
          const { count: pendingCount, error: pendingError } = await supabase
            .from('kariah_applications')
            .select('id', { count: 'exact', head: true })
            .eq('mosque_id', mosqueId)
            .eq('status', 'pending');

          if (pendingError) {
            console.error('Error fetching pending applications count:', pendingError);
            setPendingApplicationsCount(0);
          } else if (typeof pendingCount === 'number') {
            setPendingApplicationsCount(pendingCount);
          }
        } catch (pendingError) {
          console.error('Error fetching pending applications count:', pendingError);
          setPendingApplicationsCount(0);
        }

        // Fetch khairat claims for admin users
        try {
          const claimsData = await getMosqueClaims(mosqueId, undefined, 100, 0);
          setKhairatClaims(claimsData.data || []);
        } catch (claimsError) {
          console.error('Error fetching khairat claims:', claimsError);
          setKhairatClaims([]);
        }
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const contributionSource = isAdmin ? allContributions : contributions;
  const completedContributions = contributionSource.filter(
    contribution => contribution.status === 'completed'
  );
  const totalContributed = completedContributions.reduce(
    (sum, contribution) => sum + contribution.amount,
    0
  );
  const completedContributionCount = completedContributions.length;
  const recentContributions = completedContributions.slice(0, 5);

  // Calculate successful khairat claims count
  const successfulClaimsCount = khairatClaims.filter(claim => 
    claim.status === 'approved' || claim.status === 'paid'
  ).length;

  const paymentSettings = (mosqueData?.settings || {}) as {
    paymentsConfigured?: boolean;
    paymentProvidersConfigured?: boolean;
    hasPaymentProvider?: boolean;
  };
  const hasPaymentSetup =
    Boolean(paymentSettings?.paymentsConfigured) ||
    Boolean(paymentSettings?.paymentProvidersConfigured) ||
    Boolean(paymentSettings?.hasPaymentProvider);

  // Handle notification click
  const handleNotificationClick = async (notification: any) => {
    try {
      // Mark notification as read in database
      await markNotificationAsRead(notification.id);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      
      // Update unread count based on current notifications
      setUnreadCount(prev => {
        const updatedNotifications = notifications.map(n => 
          n.id === notification.id 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        );
        return updatedNotifications.filter(n => !n.is_read).length;
      });
      
      console.log('Notification clicked:', notification);
      
      // Navigate based on notification type or action_url
      if (notification.action_url) {
        window.location.href = notification.action_url;
      } else {
        // Fallback navigation based on type
        switch (notification.type) {
          case 'payment':
            window.location.href = '/payments';
            break;
          case 'application':
            if (isAdmin) {
              // Redirect to khairat applications
              window.location.href = '/applications';
            }
            break;
          case 'claim':
            if (isAdmin) {
              window.location.href = '/claims';
            }
            break;
          default:
            break;
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (onboardingLoading || !isCompleted) {
    return null;
  }

  if (userLoading || loading || roleLoading) {
    return (
      <DashboardLayout>
        <Loading 
          message="Loading dashboard..." 
          size="lg"
          className="py-12"
        />
      </DashboardLayout>
    );
  }

  // Render different dashboards based on user role
  if (!isAdmin) {
    return (
      <DashboardLayout>
        <MemberDashboard user={user} userProfile={userProfile} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Enhanced Header with Mosque Branding */}
        <div className="relative rounded-xl overflow-hidden">
          {/* Background Image */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: mosqueData?.banner_url
                ? `url(${mosqueData.banner_url})`
                : 'linear-gradient(to right, rgb(16, 185, 129), rgb(34, 197, 94))',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/80 via-emerald-500/80 to-emerald-600/80 dark:from-emerald-700/80 dark:via-emerald-600/80 dark:to-emerald-700/80"></div>
          <div className="relative p-6">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {mosqueData?.logo_url ? (
                    <Image
                      src={mosqueData.logo_url}
                      alt={`${mosqueData.name} logo`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <Building className="h-8 w-8 text-white" />
                  )}
                </div>
                <div className="text-white min-w-0 flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-1 leading-tight">
                    {t('welcome')}, {userProfile?.full_name || user?.email}
                  </h1>
                  <p className="text-white/90 text-sm sm:text-base">
                    {mosqueName 
                      ? `Administrator for ${mosqueName}`
                      : t('adminRole')
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 flex-shrink-0">
                {/* Notifications */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <div className="p-4">
                      <h3 className="font-semibold text-sm mb-3">Notifications</h3>
                      {notifications.length > 0 ? (
                        <div className="space-y-1">
                          {notifications.map((notification, index) => {
                            const isRead = notification.is_read;
                            return (
                              <div 
                                key={notification.id} 
                                className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 ${
                                  !isRead ? 'bg-gray-50 dark:bg-gray-800' : ''
                                }`}
                                onClick={() => handleNotificationClick(notification)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {notification.title}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                      {new Date(notification.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                  {!isRead && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                          No notifications
                        </p>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* View Public Profile Button */}
                {mosqueId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/mosques/${mosqueId}`, '_blank')}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t('viewPublicProfile')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title={t('totalContributed')}
            value={`RM ${totalContributed.toLocaleString()}`}
            subtitle="Total khairat received"
            icon={DollarSign}
            {...StatsCardColors.emerald}
          />

          <StatsCard
            title={t('newRegistrations')}
            value={pendingApplicationsCount}
            subtitle={t('newRegistrationsSubtitle')}
            icon={Users}
            {...StatsCardColors.blue}
          />

          <StatsCard
            title={t('totalMembers')}
            value={membershipStats?.total || 0}
            subtitle={t('totalMembersSubtitle')}
            icon={Building2}
            {...StatsCardColors.purple}
          />

          <StatsCard
            title={t('successfulClaims')}
            value={successfulClaimsCount}
            subtitle="Successful khairat claims"
            icon={TrendingUp}
            {...StatsCardColors.orange}
          />
        </div>

        {/* Admin Getting Started and Quick Actions - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminGettingStarted 
            hasMosqueProfile={!!mosqueData}
            hasPaymentSetup={hasPaymentSetup}
            applicationCount={membershipStats?.total || 0}
            contributionCount={completedContributionCount}
            claimCount={successfulClaimsCount}
          />
          <QuickActions />
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
