'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Building,
  ArrowLeft,
  Calendar,
  Users,
  CreditCard,
  Target,
} from 'lucide-react';
import {
  getMosque,
  getEvents,
  registerForEvent,
  getUserEventRegistrations,
  followMosque,
  unfollowMosque,
  isUserFollowingMosque,
  getMosqueFollowerCount,
  getContributionPrograms,
} from '@/lib/api';
import { EventCard } from '@/components/events/EventCard';
import { ContributionForm } from '@/components/contributions/ContributionForm';
import { Mosque, Event, ContributionProgram } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { FEATURES } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export default function MosqueProfilePage() {
  const params = useParams();
  const router = useRouter();
  const mosqueId = params.id as string;
  const { user } = useAuth();
  const t = useTranslations('mosqueProfile');

  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [contributionPrograms, setContributionPrograms] = useState<ContributionProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [userRegistrations, setUserRegistrations] = useState<string[]>([]);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');

  const fetchMosqueData = useCallback(async () => {
    try {
      console.log(
        '[PAGE] MosqueProfilePage - Starting to fetch mosque data for ID:',
        mosqueId
      );
      setLoading(true);

      // Fetch mosque details
      console.log('[PAGE] MosqueProfilePage - Fetching mosque details');
      const mosqueResponse = await getMosque(mosqueId);
      console.log(
        '[PAGE] MosqueProfilePage - getMosque response:',
        mosqueResponse
      );

      if (!mosqueResponse.success || !mosqueResponse.data) {
        console.error(
          '[PAGE] MosqueProfilePage - Failed to fetch mosque:',
          mosqueResponse.error
        );
        setError(mosqueResponse.error || t('notFound'));
        return;
      }

      console.log(
        '[PAGE] MosqueProfilePage - Successfully fetched mosque data'
      );
      setMosque(mosqueResponse.data);

      // Fetch events
      if (FEATURES.EVENTS_ENABLED) {
        console.log('[PAGE] MosqueProfilePage - Fetching events');
        const eventsResponse = await getEvents(mosqueId, 5);

        console.log(
          '[PAGE] MosqueProfilePage - getEvents response:',
          eventsResponse
        );

        if (eventsResponse.data) {
          console.log(
            '[PAGE] MosqueProfilePage - Successfully set events, count:',
            eventsResponse.data.length
          );
          setEvents(eventsResponse.data);

          // Fetch user registrations for these events (only if user is logged in)
          if (user?.id && eventsResponse.data.length > 0) {
            const eventIds = eventsResponse.data.map((event) => event.id);
            const registrations = await getUserEventRegistrations(
              user.id,
              eventIds
            );
            setUserRegistrations(registrations);
          }
        }
      }

      // Fetch follower count
      const followerCount = await getMosqueFollowerCount(mosqueId);
      setFollowerCount(followerCount);

      // Fetch contribution programs
      console.log('[PAGE] MosqueProfilePage - Fetching contribution programs');
      const programsResponse = await getContributionPrograms(mosqueId);
      if (programsResponse.success && programsResponse.data) {
        // Filter only active programs
        const activePrograms = programsResponse.data.filter(program => program.is_active);
        setContributionPrograms(activePrograms);
        console.log('[PAGE] MosqueProfilePage - Active programs count:', activePrograms.length);
      }

      // Check if user is following this mosque (only if user is logged in)
      if (user?.id) {
        const following = await isUserFollowingMosque(user.id, mosqueId);
        setIsFollowing(following);
      }
    } catch (err) {
      console.error('[PAGE] MosqueProfilePage - Catch error:', err);
      setError(t('errorFetchingData'));
    } finally {
      setLoading(false);
    }
  }, [mosqueId, user]);

  useEffect(() => {
    if (mosqueId) {
      fetchMosqueData();
    }
  }, [mosqueId, fetchMosqueData]);

  const handleFollow = async () => {
    if (!user?.id) {
      router.push('/login');
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        const response = await unfollowMosque(user.id, mosqueId);
        if (response.success) {
          setIsFollowing(false);
          setFollowerCount((prev) => prev - 1);
        } else {
          console.error('Failed to unfollow mosque:', response.error);
        }
      } else {
        const response = await followMosque(user.id, mosqueId);
        if (response.success) {
          setIsFollowing(true);
          setFollowerCount((prev) => prev + 1);
        } else {
          console.error('Failed to follow mosque:', response.error);
        }
      }
    } catch (error) {
      console.error('Error handling follow action:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleRegisterForEvent = async (eventId: string) => {
    if (!user?.id) {
      router.push('/login');
      return;
    }

    try {
      const response = await registerForEvent(eventId, user.id);
      if (response.success) {
        // Update user registrations
        setUserRegistrations((prev) => [...prev, eventId]);
      } else {
        console.error('Failed to register for event:', response.error);
      }
    } catch (error) {
      console.error('Failed to register for event:', error);
    }
  };

  const handleContributeToProgram = (programId: string) => {
    if (!user?.id) {
      router.push('/login');
      return;
    }
    setSelectedProgramId(programId);
    setIsContributionModalOpen(true);
  };

  const handleContributionSuccess = () => {
    setIsContributionModalOpen(false);
    setSelectedProgramId('');
    // Refresh contribution programs to get updated amounts
    fetchMosqueData();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {t('loading')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !mosque) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('notFound')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={() => router.push('/mosques')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('backToMosques')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <Button
              onClick={() => router.push('/mosques')}
              variant="ghost"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('backToMosques')}
            </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          {/* Cover Image Placeholder */}
          <div className="h-48 bg-gradient-to-r from-emerald-500 to-green-600 relative">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-end justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center">
                    <Building className="h-10 w-10 text-emerald-600" />
                  </div>
                  <div className="text-white">
                    <h1 className="text-3xl font-bold mb-1">{mosque.name}</h1>
                    {mosque.address && (
                      <div className="flex items-center text-white/90">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{mosque.address}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {user && (
                    <Button
                      onClick={handleFollow}
                      disabled={followLoading}
                      variant={isFollowing ? 'secondary' : 'default'}
                      className={
                        isFollowing
                          ? 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                          : 'bg-white text-emerald-600 hover:bg-gray-100'
                      }
                    >
                      {followLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      ) : isFollowing ? (
                        <>
                          <Users className="h-4 w-4 mr-2" />
                          {t('following')}
                        </>
                      ) : (
                        <>
                          <Users className="h-4 w-4 mr-2" />
                          {t('follow')}
                        </>
                      )}
                    </Button>
                  )}
                  <Badge
                    variant="secondary"
                    className="bg-white/20 text-white border-white/30"
                  >
                    {t('active')}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Users className="h-4 w-4 mr-2" />
                  <span className="font-medium">{followerCount}</span>
                  <span className="ml-1">
                    {followerCount === 1 ? t('follower') : t('followers')}
                  </span>
                </div>
                {mosque.settings?.established_year != null && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{t('established')} {String(mosque.settings.established_year)}</span>
                  </div>
                )}
                {mosque.settings?.capacity != null && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Building className="h-4 w-4 mr-2" />
                    <span>{t('capacity')}: {String(mosque.settings.capacity)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {mosque.description && (
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                {mosque.description}
              </p>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
                <TabsTrigger value="programs">{t('programs')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6 mt-6">
            {/* About Section */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Building className="h-5 w-5 mr-2 text-emerald-600" />
                  {t('aboutMosque')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mosque.settings?.imam_name != null && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {t('imam')}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {String(mosque.settings.imam_name)}
                    </p>
                  </div>
                )}
                {mosque.settings?.services != null &&
                  Array.isArray(mosque.settings.services) &&
                  mosque.settings.services.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {t('servicesPrograms')}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(mosque.settings.services as string[]).map(
                          (service, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200"
                            >
                              {service}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Prayer Times */}
            {mosque.prayer_times && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <Calendar className="h-5 w-5 mr-2 text-emerald-600" />
                    {t('prayerTimes')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(mosque.prayer_times).map(
                      ([prayer, time]) => (
                        <div
                          key={prayer}
                          className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="font-semibold text-gray-900 dark:text-white capitalize mb-1">
                            {prayer}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {String(time)}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Programs Section */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-xl">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-emerald-600" />
                    {t('activePrograms')}
                  </div>
                  {contributionPrograms.length > 3 && (
                    <Button 
                       variant="outline" 
                       size="sm"
                       onClick={() => setActiveTab('programs')}
                     >
                       {t('viewAllPrograms')}
                     </Button>
                  )}
                </CardTitle>
                <CardDescription>
                  {t('supportPrograms')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contributionPrograms.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {t('noActivePrograms')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contributionPrograms.slice(0, 3).map((program) => {
                      const progressPercentage = program.target_amount 
                        ? Math.min((program.current_amount || 0) / program.target_amount * 100, 100)
                        : 0;
                      
                      return (
                        <div
                          key={program.id}
                          className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {program.name}
                                </h4>
                                <Badge 
                                  variant="secondary" 
                                  className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                                >
                                  {program.program_type}
                                </Badge>
                              </div>
                              {program.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {program.description}
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleContributeToProgram(program.id)}
                              className="ml-4 bg-emerald-600 hover:bg-emerald-700"
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              {t('contribute')}
                            </Button>
                          </div>
                          
                          {/* Progress Bar */}
                          {program.target_amount && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                  {t('progress')}
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  RM {(program.current_amount || 0).toLocaleString()} / RM {program.target_amount.toLocaleString()}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${progressPercentage}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {t('completed', { percentage: progressPercentage.toFixed(1) })}
                              </div>
                            </div>
                          )}
                          
                          {/* Ongoing program without target */}
                          {!program.target_amount && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                {t('totalRaised')}
                              </span>
                              <span className="font-medium text-emerald-600">
                                RM {(program.current_amount || 0).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Events Section */}
            {FEATURES.EVENTS_ENABLED && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-xl">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-emerald-600" />
                      {t('upcomingEvents')}
                    </div>
                    {events.length > 3 && (
                      <Button variant="outline" size="sm">
                        {t('viewAllEvents')}
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        {t('noUpcomingEvents')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {events.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                {event.title}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {formatDateTime(event.event_date)}
                              </p>
                              {event.location && (
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-500">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {event.location}
                                </div>
                              )}
                            </div>
                            {user && !userRegistrations.includes(event.id) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRegisterForEvent(event.id)}
                                className="ml-4"
                              >
                                {t('register')}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
              </TabsContent>
              
              <TabsContent value="programs" className="space-y-6 mt-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                    <CreditCard className="h-5 w-5 mr-2 text-emerald-600" />
                    {t('allPrograms')}
                  </CardTitle>
                  <CardDescription>
                    {t('supportPrograms')}
                  </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {contributionPrograms.length === 0 ? (
                      <div className="text-center py-8">
                        <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                          {t('noActivePrograms')}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {contributionPrograms.map((program) => {
                          const progressPercentage = program.target_amount 
                            ? Math.min((program.current_amount || 0) / program.target_amount * 100, 100)
                            : 0;
                          
                          return (
                            <div
                              key={program.id}
                              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                      {program.name}
                                    </h4>
                                    <Badge 
                                      variant="secondary" 
                                      className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                                    >
                                      {program.program_type}
                                    </Badge>
                                  </div>
                                  {program.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                      {program.description}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleContributeToProgram(program.id)}
                                  className="ml-4 bg-emerald-600 hover:bg-emerald-700"
                                >
                                  <CreditCard className="h-4 w-4 mr-1" />
                                  {t('contribute')}
                                </Button>
                              </div>
                              
                              {/* Progress Bar */}
                              {program.target_amount && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      {t('progress')}
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      RM {(program.current_amount || 0).toLocaleString()} / RM {program.target_amount.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div 
                                      className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${progressPercentage}%` }}
                                    ></div>
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {t('completed', { percentage: progressPercentage.toFixed(1) })}
                                  </div>
                                </div>
                              )}
                              
                              {/* Ongoing program without target */}
                              {!program.target_amount && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {t('totalRaised')}
                                  </span>
                                  <span className="font-medium text-emerald-600">
                                    RM {(program.current_amount || 0).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Contact & Info */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                <Phone className="h-5 w-5 mr-2 text-emerald-600" />
                {t('contactInformation')}
              </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mosque.phone && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <Phone className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('phone')}
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {mosque.phone}
                      </p>
                    </div>
                  </div>
                )}
                {mosque.email && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <Mail className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('email')}
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {mosque.email}
                      </p>
                    </div>
                  </div>
                )}
                {mosque.website && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <Globe className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('website')}
                      </p>
                      <a
                        href={mosque.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        {t('visitWebsite')}
                      </a>
                    </div>
                  </div>
                )}
                {mosque.address && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mt-1">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('address')}
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white leading-relaxed">
                        {mosque.address}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                <Users className="h-5 w-5 mr-2 text-emerald-600" />
                {t('community')}
              </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {followerCount}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {followerCount === 1 ? t('follower') : t('followers')}
                  </div>
                </div>
                {!user && (
                  <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {t('joinCommunity')}
                    </p>
                    <Button
                      onClick={() => router.push('/login')}
                      className="w-full"
                    >
                      {t('signInToFollow')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Contribution Modal */}
      <ContributionForm
        isOpen={isContributionModalOpen}
        onClose={() => setIsContributionModalOpen(false)}
        onSuccess={handleContributionSuccess}
        preselectedMosqueId={mosque?.id}
        preselectedProgramId={selectedProgramId}
      />
    </div>
  );
}
