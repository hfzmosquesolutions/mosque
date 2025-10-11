'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  User,
  Heart,
  Users,
  ArrowRight,
  Calendar,
  MapPin,
  DollarSign,
  TrendingUp,
  Activity,
  Bell,
  Building,
  Clock,
  CheckCircle,
  BookOpen,
  FileText,
  UserPlus,
  Star,
  Target,
  Award,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import { getUserFollowStats } from '@/lib/api/following';
import { getUserNotifications, markNotificationAsRead } from '@/lib/api/notifications';
import { QuickActions } from './QuickActions';
import { MemberStatsCards } from './MemberStatsCards';
import { MemberRecentActivity } from './MemberRecentActivity';
import { MemberQuickInsights } from './MemberQuickInsights';
import { MemberGettingStarted } from './MemberGettingStarted';

interface Contribution {
  id: string;
  amount: number;
  contributed_at: string;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  program: {
    name: string;
    mosque: {
      name: string;
    };
  };
}

interface MemberDashboardProps {
  user: any;
  userProfile: any;
}

export function MemberDashboard({ user, userProfile }: MemberDashboardProps) {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [dependentsCount, setDependentsCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');

  useEffect(() => {
    if (user) {
      fetchMemberData();
    }
  }, [user]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notificationsData = await getUserNotifications(1, 5);
        setNotifications(notificationsData.data);
        
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

  const fetchMemberData = async () => {
    try {
      setLoading(true);

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
              name: item.program?.name || 'Unknown Program',
              mosque: {
                name: item.program?.mosque?.name || 'Unknown Mosque',
              },
            },
          })) || [];
        setContributions(formattedContributions);
      }

      // Fetch dependents count
      const { data: dependentsData, error: dependentsError } = await supabase
        .from('dependents')
        .select('id')
        .eq('user_id', user?.id);

      if (!dependentsError && dependentsData) {
        setDependentsCount(dependentsData.length);
      }

      // Fetch follower count
      try {
        const userStats = await getUserFollowStats(user.id);
        setFollowerCount(userStats.followers_count);
      } catch (followerError) {
        console.error('Error fetching follower count:', followerError);
        setFollowerCount(0);
      }

    } catch (error) {
      console.error('Error fetching member data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalContributed = contributions
    .filter(contribution => contribution.status === 'completed')
    .reduce((sum, contribution) => sum + contribution.amount, 0);

  const recentContributions = contributions
    .filter(contribution => contribution.status === 'completed')
    .slice(0, 5);

  // Handle notification click
  const handleNotificationClick = async (notification: any) => {
    try {
      await markNotificationAsRead(notification.id);
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      
      setUnreadCount(prev => {
        const updatedNotifications = notifications.map(n => 
          n.id === notification.id 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        );
        return updatedNotifications.filter(n => !n.is_read).length;
      });
      
      if (notification.action_url) {
        window.location.href = notification.action_url;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) {
    return (
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Member Header */}
      <div className="relative rounded-xl overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(to right, rgb(59, 130, 246), rgb(37, 99, 235))',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 via-blue-500/80 to-blue-600/80 dark:from-blue-700/80 dark:via-blue-600/80 dark:to-blue-700/80"></div>
        <div className="relative p-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                <User className="h-8 w-8 text-white" />
              </div>
              <div className="text-white min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold mb-1 leading-tight">
                  {t('welcome')}, {userProfile?.full_name || user?.email}
                </h1>
                <p className="text-white/90 text-sm sm:text-base">
                  Community Member
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
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => window.open(`/users/${user?.id}`, '_blank')}
                 className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
               >
                 <ExternalLink className="h-4 w-4" />
                 View Public Profile
               </Button>
             </div>
           </div>
         </div>
       </div>

      {/* Member Stats Cards */}
      <MemberStatsCards 
        totalContributed={totalContributed}
        followerCount={followerCount}
        dependentsCount={dependentsCount}
        recentContributionsCount={recentContributions.length}
        eventsAttended={0} // TODO: Implement events tracking
        mosquesFollowed={0} // TODO: Implement mosque following tracking
      />

      {/* Getting Started and Quick Actions - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MemberGettingStarted 
          totalContributed={totalContributed}
          dependentsCount={dependentsCount}
          contributionsCount={contributions.length}
          hasAppliedForKariah={false} // TODO: Implement kariah application tracking
        />
        <QuickActions />
      </div>

      {/* Member-specific content */}
      <div className="space-y-6">
        {/* Quick Insights */}
        <MemberQuickInsights 
          totalContributed={totalContributed}
          contributionsCount={contributions.length}
          dependentsCount={dependentsCount}
        />
      </div>
    </div>
  );
}
