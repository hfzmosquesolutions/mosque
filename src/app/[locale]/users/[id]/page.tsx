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

export default function PublicUserProfilePage() {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const params = useParams();
  const { user: currentUser } = useAuth();
  const userId = params.id as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getUserProfile(userId);

      if (response.success && response.data) {
        setProfile(response.data);

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {t('loadingProfile')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('profileNotFoundTitle')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-emerald-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="pointer-events-none absolute inset-0 opacity-[0.12] blur-3xl">
          <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-emerald-300/40" />
          <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-teal-300/40" />
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {tCommon('back')}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
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

        {/* Hero Section */}
        <div className="relative bg-white/90 dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-8 backdrop-blur">
          {/* Cover Image */}
          <div
            className="h-48 relative"
            style={{
              backgroundImage: profile.profile_picture_url
                ? `url(${profile.profile_picture_url})`
                : 'linear-gradient(to right, rgb(16, 185, 129), rgb(34, 197, 94))',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-end sm:justify-between sm:space-y-0">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={profile.profile_picture_url} />
                      <AvatarFallback className="text-lg">
                        {getInitials(profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="text-white min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 leading-tight">
                      {profile.full_name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2">
                      {getRoleIcon()}
                      <Badge 
                        variant={getRoleBadgeVariant()} 
                        className="bg-white/20 text-white border-white/30 text-xs sm:text-sm px-2 py-1"
                      >
                        {profile.account_type === 'admin'
                          ? t('administrator')
                          : t('memberRole')}
                      </Badge>
                      {profile.membership_type && (
                        <Badge 
                          variant="outline" 
                          className="bg-white/20 text-white border-white/30 text-xs sm:text-sm px-2 py-1"
                        >
                          {profile.membership_type.charAt(0).toUpperCase() +
                            profile.membership_type.slice(1)}{' '}
                          {t('memberRole')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-2 sm:space-x-3 flex-shrink-0">
                  <Badge
                    variant="secondary"
                    className="bg-white/20 text-white border-white/30 text-xs sm:text-sm px-2 py-1"
                  >
                    {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="px-6 py-4 bg-white/70 dark:bg-slate-900/40 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <Calendar className="h-4 w-4 mr-2" />
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            {/* About Section */}
            <Card className="border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800 shadow-sm mb-8 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <User className="h-5 w-5 mr-2 text-emerald-600" />
                  {t('aboutUser')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                      {t('basicInformation')}
                    </h4>
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
                  </div>

                  {/* Community Information */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                      {t('communityInformation')}
                    </h4>
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
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quick Actions & Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Users className="h-5 w-5 mr-2 text-emerald-600" />
                  {t('quickActions')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  {isOwnProfile && (
                    <Link href="/profile">
                      <Button variant="ghost" className="w-full justify-start p-3 h-auto">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 bg-emerald-100 dark:bg-emerald-800">
                          <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-medium text-slate-900 dark:text-white text-sm">
                            {t('editProfile')}
                          </h3>
                        </div>
                      </Button>
                    </Link>
                  )}
                  <Button 
                    variant="ghost" 
                    onClick={handleShare} 
                    className="w-full justify-start p-3 h-auto"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 bg-blue-100 dark:bg-blue-800">
                      <Share2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-medium text-slate-900 dark:text-white text-sm">
                        {t('share')}
                      </h3>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Profile Stats */}
            <Card className="border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Calendar className="h-5 w-5 mr-2 text-emerald-600" />
                  {t('profileStats')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t('memberSince')}
                    </p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {new Date(profile.created_at).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Privacy Notice */}
        <Card className="mt-8 border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800 shadow-sm backdrop-blur">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-slate-500 dark:text-slate-400">
              <p>
                {t('publicProfileNotice')}
              </p>
              {isOwnProfile && (
                <p className="mt-2">
                  <Link
                    href="/profile"
                    className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
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
