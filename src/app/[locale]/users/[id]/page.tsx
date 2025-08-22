'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Calendar,
  Briefcase,
  Shield,
  Users,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import { getUserProfile } from '@/lib/api';
import { UserProfile } from '@/types/database';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { FollowButton } from '@/components/following/FollowButton';
import { getUserFollowStats } from '@/lib/api/following';

export default function PublicUserProfilePage() {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const params = useParams();
  const { user: currentUser } = useAuth();
  const userId = params.id as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getUserProfile(userId);

      if (response.success && response.data) {
        setProfile(response.data);

        // Fetch follow stats
        const stats = await getUserFollowStats(userId);
        setFollowerCount(stats.followers_count);
        setFollowingCount(stats.following_count);
      } else {
        setError(response.error || 'Profile not found');
      }
    } catch {
      setError('Failed to load profile');
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId, fetchProfile]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleIcon = () => {
    if (profile?.account_type === 'admin') {
      return <Shield className="h-4 w-4 text-green-600" />;
    }
    return <Users className="h-4 w-4 text-blue-600" />;
  };

  const getRoleBadgeVariant = () => {
    return profile?.account_type === 'admin' ? 'default' : 'secondary';
  };

  const isOwnProfile = currentUser?.id === userId;

  const handleFollowChange = (isFollowing: boolean) => {
    setFollowerCount((prev) => (isFollowing ? prev + 1 : prev - 1));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.full_name}'s Profile`,
          text: `Check out ${profile?.full_name}'s profile on our mosque community platform.`,
          url: window.location.href,
        });
      } catch {
        // User cancelled sharing or sharing failed
        console.log('Sharing cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
              <p className="text-slate-600">{t('loadingProfile')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                {t('profileNotFoundTitle')}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {error || t('profileNotFoundDescription')}
              </p>
              <Link href="/dashboard">
                <Button className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  {t('backToDashboard')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {tCommon('back')}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {!isOwnProfile && currentUser && (
              <FollowButton
                userId={userId}
                userName={profile?.full_name || 'User'}
                variant="default"
                size="sm"
                onFollowChange={handleFollowChange}
              />
            )}
            {isOwnProfile && (
              <Link href="/profile">
                <Button variant="outline" className="gap-2">
                  <User className="h-4 w-4" />
                  {t('editProfile')}
                </Button>
              </Link>
            )}
            <Button variant="outline" onClick={handleShare} className="gap-2">
              <Share2 className="h-4 w-4" />
              {t('share')}
            </Button>
          </div>
        </div>

        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profile.profile_picture_url} />
                <AvatarFallback className="text-2xl">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {profile.full_name}
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
                  {getRoleIcon()}
                  <Badge variant={getRoleBadgeVariant()} className="text-sm">
                    {profile.account_type === 'admin'
                      ? t('administrator')
                      : t('memberRole')}
                  </Badge>
                  {profile.membership_type && (
                    <Badge variant="outline" className="text-sm">
                      {profile.membership_type.charAt(0).toUpperCase() +
                        profile.membership_type.slice(1)}{' '}
                      {t('memberRole')}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col items-center md:items-start gap-2 text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">
                        {t('followerCount', { count: followerCount })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">
                        {t('followingCount', { count: followingCount })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {t('memberSince')}{' '}
                      {new Date(profile.created_at).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('basicInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.occupation && (
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">{t('occupation')}</p>
                    <p className="font-medium">{profile.occupation}</p>
                  </div>
                </div>
              )}
              {profile.gender && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">{t('gender')}</p>
                    <p className="font-medium">
                      {profile.gender.charAt(0).toUpperCase() +
                        profile.gender.slice(1)}
                    </p>
                  </div>
                </div>
              )}
              {profile.date_of_birth && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">{t('dateOfBirth')}</p>
                    <p className="font-medium">
                      {new Date(profile.date_of_birth).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }
                      )}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Community Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('communityInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-500">{t('accountType')}</p>
                  <p className="font-medium">
                    {profile.account_type === 'admin'
                      ? t('administrator')
                      : t('memberRole')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-500">{t('membershipType')}</p>
                  <p className="font-medium">
                    {profile.membership_type
                      ? profile.membership_type.charAt(0).toUpperCase() +
                        profile.membership_type.slice(1)
                      : t('regular')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-500">{tCommon('status')}</p>
                  <Badge
                    variant={
                      profile.status === 'active' ? 'default' : 'secondary'
                    }
                  >
                    {profile.status.charAt(0).toUpperCase() +
                      profile.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Privacy Notice */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-slate-500">
              <p>
                {t('publicProfileNotice')}
              </p>
              {isOwnProfile && (
                <p className="mt-2">
                  <Link
                    href="/profile"
                    className="text-blue-600 hover:text-blue-800"
                   >
                    {t('editProfileSettings')}
                  </Link>{' '}
                  {t('manageVisibility')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
