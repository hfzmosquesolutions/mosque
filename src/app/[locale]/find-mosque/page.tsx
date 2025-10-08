'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Search,
  Building,
  Filter,
  Heart,
} from 'lucide-react';
import {
  getAllMosques,
  followMosque,
  unfollowMosque,
  isUserFollowingMosque,
} from '@/lib/api';
import { Mosque } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useOnboardingRedirect } from '@/hooks/useOnboardingStatus';

function FindMosqueContent() {
  const t = useTranslations('findMosque');
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [filteredMosques, setFilteredMosques] = useState<Mosque[]>([]);
  const [followedMosques, setFollowedMosques] = useState<Mosque[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followingStatus, setFollowingStatus] = useState<
    Record<string, boolean>
  >({});
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>(
    {}
  );
  const router = useRouter();
  const { user } = useAuth();
  const { isCompleted, isLoading: onboardingLoading } = useOnboardingRedirect();

  useEffect(() => {
    if (!onboardingLoading && isCompleted) {
      fetchMosques();
    }
  }, [onboardingLoading, isCompleted]);

  const fetchMosques = async () => {
    try {
      setLoading(true);
      const response = await getAllMosques();

      if (response.success && response.data) {
        setMosques(response.data);
        setFilteredMosques(response.data);

        // Check following status for each mosque
        if (user?.id) {
          const followingStatusMap: Record<string, boolean> = {};
          for (const mosque of response.data) {
            const isFollowing = await isUserFollowingMosque(user.id, mosque.id);
            followingStatusMap[mosque.id] = isFollowing;
          }

          const followed = response.data.filter(
            (mosque: Mosque) => followingStatusMap[mosque.id]
          );

          setFollowedMosques(followed);
          setFollowingStatus(followingStatusMap);
        }
      } else {
        setError(response.error || t('failedToFetchMosques'));
      }
    } catch (err) {
      console.error('Error fetching mosques:', err);
      setError(t('unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  const filterMosques = useCallback(() => {
    let results = [...mosques];

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      results = results.filter((mosque) =>
        mosque.name.toLowerCase().includes(query) ||
        mosque.address?.toLowerCase().includes(query) ||
        mosque.description?.toLowerCase().includes(query) ||
        mosque.city?.toLowerCase().includes(query) ||
        mosque.state?.toLowerCase().includes(query) ||
        mosque.postcode?.toLowerCase().includes(query)
      );
    }

    setFilteredMosques(results);
  }, [searchQuery, mosques]);

  useEffect(() => {
    filterMosques();
  }, [filterMosques]);

  const handleFollowToggle = async (mosqueId: string) => {
    if (!user?.id) return;

    setFollowLoading((prev) => ({ ...prev, [mosqueId]: true }));

    try {
      const isCurrentlyFollowing = followingStatus[mosqueId];

      if (isCurrentlyFollowing) {
        const response = await unfollowMosque(user.id, mosqueId);
        if (response.success) {
          const newFollowingStatus = {
            ...followingStatus,
            [mosqueId]: false,
          };
          setFollowingStatus(newFollowingStatus);

          // Update followed mosques list
          const followed = mosques.filter(
            (mosque) => newFollowingStatus[mosque.id]
          );
          setFollowedMosques(followed);
        }
      } else {
        const response = await followMosque(user.id, mosqueId);
        if (response.success) {
          const newFollowingStatus = {
            ...followingStatus,
            [mosqueId]: true,
          };
          setFollowingStatus(newFollowingStatus);

          // Update followed mosques list
          const followed = mosques.filter(
            (mosque) => newFollowingStatus[mosque.id]
          );
          setFollowedMosques(followed);
        }
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
    } finally {
      setFollowLoading((prev) => ({ ...prev, [mosqueId]: false }));
    }
  };

  const handleViewMosque = (mosqueId: string) => {
    window.open(`/mosques/${mosqueId}`, '_blank');
  };

  if (onboardingLoading || !isCompleted) {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('loadingMosques')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building className="h-12 w-12 text-red-500" />
          </div>
          <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">
            {t('errorLoadingMosques')}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
            {error}
          </p>
          <Button onClick={fetchMosques} variant="outline">
            {t('tryAgain')}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={t('findMosques')}>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-2xl" />
          <div className="relative p-6">
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground text-lg">
                  {t('discoverMosques')}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    <span>
                      {t('mosquesAvailable', { count: filteredMosques.length })}
                    </span>
                  </div>
                  <span>{t('verifiedListings')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section with Search */}
        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-600">
              <TabsTrigger 
                value="all" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                {t('allMosques')}
              </TabsTrigger>
              <TabsTrigger 
                value="following" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                {t('following')}
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-col sm:flex-row gap-3 sm:w-auto w-full">
              <div className="flex-1 sm:w-80 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder={t('searchMosques')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
              <Button
                variant="outline"
                className="flex items-center gap-2 sm:w-auto"
              >
                <Filter className="h-4 w-4" />
                {t('filters')}
              </Button>
            </div>
          </div>

          <TabsContent value="all" className="space-y-6">
            <div>
              <p className="text-muted-foreground">
                {searchQuery
                  ? t('searchResults', {
                      count: filteredMosques.length,
                      query: searchQuery,
                    })
                  : t('showingMosques', { count: filteredMosques.length })}
              </p>
            </div>

            {/* Mosques Grid */}
            {filteredMosques.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {t('noMosquesFound')}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {searchQuery
                      ? t('adjustSearchTerms')
                      : t('noMosquesRegistered')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMosques.map((mosque) => (
                  <Card
                    key={mosque.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">
                            {mosque.name}
                          </CardTitle>
                          {mosque.address && (
                            <CardDescription className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              {mosque.address}
                            </CardDescription>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {t('verified')}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {mosque.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {mosque.description}
                        </p>
                      )}

                      <div className="space-y-2 text-sm">
                        {mosque.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{mosque.phone}</span>
                          </div>
                        )}
                        {mosque.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{mosque.email}</span>
                          </div>
                        )}
                        {mosque.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={mosque.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {t('visitWebsite')}
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFollowToggle(mosque.id);
                          }}
                          disabled={followLoading[mosque.id]}
                          className="flex-1"
                        >
                          <Heart
                            className={`h-4 w-4 mr-1 ${
                              followingStatus[mosque.id] ? 'fill-current' : ''
                            }`}
                          />
                          {followingStatus[mosque.id]
                            ? t('following')
                            : t('follow')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewMosque(mosque.id);
                          }}
                          className="flex-1"
                        >
                          {t('viewDetails')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="following" className="space-y-6">
            <div>
              <p className="text-muted-foreground">
                {t('mosquesFollowing', { count: followedMosques.length })}
              </p>
            </div>

            {/* Followed Mosques Grid */}
            {followedMosques.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {t('noFollowedMosques')}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t('startFollowingMosques')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {followedMosques.map((mosque) => (
                  <Card
                    key={mosque.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">
                            {mosque.name}
                          </CardTitle>
                          {mosque.address && (
                            <CardDescription className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              {mosque.address}
                            </CardDescription>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {t('verified')}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {mosque.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {mosque.description}
                        </p>
                      )}

                      <div className="space-y-2 text-sm">
                        {mosque.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{mosque.phone}</span>
                          </div>
                        )}
                        {mosque.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{mosque.email}</span>
                          </div>
                        )}
                        {mosque.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={mosque.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {t('visitWebsite')}
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFollowToggle(mosque.id);
                          }}
                          disabled={followLoading[mosque.id]}
                          className="flex-1"
                        >
                          <Heart className="h-4 w-4 mr-1 fill-current" />
                          {t('following')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewMosque(mosque.id);
                          }}
                          className="flex-1"
                        >
                          {t('viewDetails')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

export default function FindMosquePage() {
  return (
    <ProtectedRoute>
      <FindMosqueContent />
    </ProtectedRoute>
  );
}
