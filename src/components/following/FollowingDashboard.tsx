'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Building, TrendingUp, Search } from 'lucide-react';
import { FollowingList } from './FollowingList';
import { UserSearch } from './UserSearch';
import { getComprehensiveUserStats } from '@/lib/api/following';
import { useAuth } from '@/contexts/AuthContext';

interface UserStats {
  followers_count: number;
  following_count: number;
  mosque_followers_count: number;
}

interface FollowingDashboardProps {
  userId?: string; // If not provided, shows current user's dashboard
  showSearch?: boolean; // Whether to show the user search tab
}

export function FollowingDashboard({
  userId,
  showSearch = true,
}: FollowingDashboardProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const targetUserId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  useEffect(() => {
    if (!targetUserId) return;

    const fetchStats = async () => {
      try {
        const statsData = await getComprehensiveUserStats(targetUserId);
        setStats(statsData);
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [targetUserId]);

  const handleUserFollow = () => {
    // Refresh stats when a user is followed
    if (targetUserId) {
      getComprehensiveUserStats(targetUserId).then(setStats);
    }
  };

  const StatsOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">
                {stats?.followers_count || 0}
              </p>
              <p className="text-sm text-muted-foreground">Followers</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold">
                {stats?.following_count || 0}
              </p>
              <p className="text-sm text-muted-foreground">Following</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Building className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">
                {stats?.mosque_followers_count || 0}
              </p>
              <p className="text-sm text-muted-foreground">Mosque Followers</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {isOwnProfile ? 'Your Social Network' : 'Social Network'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatsOverview />

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList
              className={`grid ${
                showSearch && isOwnProfile ? 'grid-cols-4' : 'grid-cols-3'
              }`}
            >
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="followers"
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Followers
                <Badge variant="secondary" className="ml-1">
                  {stats?.followers_count || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="following"
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Following
                <Badge variant="secondary" className="ml-1">
                  {stats?.following_count || 0}
                </Badge>
              </TabsTrigger>
              {showSearch && isOwnProfile && (
                <TabsTrigger value="search" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Find Users
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FollowingList
                  userId={targetUserId}
                  showTabs={false}
                  defaultTab="followers"
                />
                <FollowingList
                  userId={targetUserId}
                  showTabs={false}
                  defaultTab="following"
                />
              </div>

              <div className="mt-6">
                <FollowingList
                  userId={targetUserId}
                  showTabs={false}
                  defaultTab="mosque-followers"
                />
              </div>
            </TabsContent>

            <TabsContent value="followers" className="mt-6">
              <FollowingList
                userId={targetUserId}
                showTabs={false}
                defaultTab="followers"
              />
            </TabsContent>

            <TabsContent value="following" className="mt-6">
              <FollowingList
                userId={targetUserId}
                showTabs={false}
                defaultTab="following"
              />
            </TabsContent>

            {showSearch && isOwnProfile && (
              <TabsContent value="search" className="mt-6">
                <UserSearch
                  onUserFollow={handleUserFollow}
                  excludeUserIds={[targetUserId!]}
                  maxResults={15}
                />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
