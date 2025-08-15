'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, Building, Loader2 } from 'lucide-react';
import {
  getFollowing,
  getFollowers,
  getMosqueFollowers,
} from '@/lib/api/following';
import { FollowButton } from './FollowButton';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface FollowingListProps {
  userId?: string; // If not provided, shows current user's data
  showTabs?: boolean; // Whether to show tabs for followers/following
  defaultTab?: 'followers' | 'following' | 'mosque-followers';
}

interface UserFollowData {
  id: string;
  followed_at: string;
  follower_id?: string;
  following_id?: string;
  user_profiles: {
    id: string;
    full_name: string;
    profile_picture_url?: string;
    is_profile_private: boolean;
  };
}

interface MosqueFollowData {
  id: string;
  followed_at: string;
  mosque_id: string;
  mosques: {
    id: string;
    name: string;
    description?: string;
    is_private: boolean;
  };
}

interface ApiResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export function FollowingList({
  userId,
  showTabs = true,
  defaultTab = 'followers',
}: FollowingListProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [followers, setFollowers] = useState<UserFollowData[]>([]);
  const [following, setFollowing] = useState<UserFollowData[]>([]);
  const [mosqueFollowers, setMosqueFollowers] = useState<MosqueFollowData[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetUserId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  useEffect(() => {
    if (!targetUserId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [followersData, followingData, mosqueFollowersData] =
          await Promise.all([
            getFollowers(),
            getFollowing(),
            getMosqueFollowers(targetUserId),
          ]);

        setFollowers(followersData.data as unknown as UserFollowData[]);
        setFollowing(followingData.data as unknown as UserFollowData[]);
        setMosqueFollowers(
          mosqueFollowersData.data as unknown as MosqueFollowData[]
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load following data'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [targetUserId]);

  const handleFollowChange = () => {
    // Refresh the data when follow status changes
    if (targetUserId) {
      getFollowers().then((data) =>
        setFollowers(data.data as unknown as UserFollowData[])
      );
      getFollowing().then((data) =>
        setFollowing(data.data as unknown as UserFollowData[])
      );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const FollowersList = ({ users }: { users: UserFollowData[] }) => (
    <div className="space-y-4">
      {users.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          {activeTab === 'followers'
            ? 'No followers yet'
            : 'Not following anyone yet'}
        </p>
      ) : (
        users.map((item) => {
          const userProfile = item.user_profiles;
          if (!userProfile) return null;

          return (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={userProfile.profile_picture_url} />
                  <AvatarFallback>
                    {userProfile.full_name
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Link
                    href={`/users/${userProfile.id}`}
                    className="font-medium hover:underline"
                  >
                    {userProfile.full_name}
                  </Link>
                  {userProfile.is_profile_private && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Private
                    </Badge>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {activeTab === 'followers'
                      ? 'Following since'
                      : 'Followed since'}{' '}
                    {new Date(item.followed_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {isOwnProfile && activeTab === 'followers' && (
                <FollowButton
                  userId={userProfile.id}
                  userName={userProfile.full_name}
                  variant="outline"
                  size="sm"
                  onFollowChange={handleFollowChange}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );

  const MosqueFollowersList = ({
    mosques,
  }: {
    mosques: MosqueFollowData[];
  }) => (
    <div className="space-y-4">
      {mosques.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No mosques following this user yet
        </p>
      ) : (
        mosques.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <Building className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <Link
                  href={`/mosques/${item.mosques.id}`}
                  className="font-medium hover:underline"
                >
                  {item.mosques.name}
                </Link>
                {item.mosques.is_private && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Private
                  </Badge>
                )}
                <p className="text-sm text-muted-foreground">
                  Following since{' '}
                  {new Date(item.followed_at).toLocaleDateString()}
                </p>
                {item.mosques.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.mosques.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (!showTabs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {defaultTab === 'followers'
              ? 'Followers'
              : defaultTab === 'following'
              ? 'Following'
              : 'Mosque Followers'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {defaultTab === 'followers' && <FollowersList users={followers} />}
          {defaultTab === 'following' && <FollowersList users={following} />}
          {defaultTab === 'mosque-followers' && (
            <MosqueFollowersList mosques={mosqueFollowers} />
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Social Connections
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
        >
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="followers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Followers ({followers.length})
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Following ({following.length})
            </TabsTrigger>
            <TabsTrigger
              value="mosque-followers"
              className="flex items-center gap-2"
            >
              <Building className="h-4 w-4" />
              Mosque Followers ({mosqueFollowers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="mt-6">
            <FollowersList users={followers} />
          </TabsContent>

          <TabsContent value="following" className="mt-6">
            <FollowersList users={following} />
          </TabsContent>

          <TabsContent value="mosque-followers" className="mt-6">
            <MosqueFollowersList mosques={mosqueFollowers} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
