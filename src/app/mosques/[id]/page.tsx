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
} from '@/lib/api';
import { EventCard } from '@/components/events/EventCard';
import { Mosque, Event } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

export default function MosqueProfilePage() {
  const params = useParams();
  const router = useRouter();
  const mosqueId = params.id as string;
  const { user } = useAuth();

  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [userRegistrations, setUserRegistrations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

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
        setError(mosqueResponse.error || 'Mosque not found');
        return;
      }

      console.log(
        '[PAGE] MosqueProfilePage - Successfully fetched mosque data'
      );
      setMosque(mosqueResponse.data);

      // Fetch events
      console.log(
        '[PAGE] MosqueProfilePage - Fetching events'
      );
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
          const eventIds = eventsResponse.data.map(event => event.id);
          const registrations = await getUserEventRegistrations(user.id, eventIds);
          setUserRegistrations(registrations);
        }
      }

      // Fetch follower count
      const followerCount = await getMosqueFollowerCount(mosqueId);
      setFollowerCount(followerCount);

      // Check if user is following this mosque (only if user is logged in)
      if (user?.id) {
        const following = await isUserFollowingMosque(user.id, mosqueId);
        setIsFollowing(following);
      }
    } catch (err) {
      console.error('[PAGE] MosqueProfilePage - Catch error:', err);
      setError('An error occurred while fetching mosque data');
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
        setUserRegistrations(prev => [...prev, eventId]);
      } else {
        console.error('Failed to register for event:', response.error);
      }
    } catch (error) {
      console.error('Failed to register for event:', error);
    }
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
              Loading mosque details...
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
              Mosque Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={() => router.push('/mosques')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Mosques
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => router.push('/mosques')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Mosques
          </Button>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {mosque.name}
                  </h1>
                  {mosque.address && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400 mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{mosque.address}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                    <Users className="h-4 w-4 mr-1" />
                    <span>
                      {followerCount}{' '}
                      {followerCount === 1 ? 'follower' : 'followers'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {user && (
                  <Button
                    onClick={handleFollow}
                    disabled={followLoading}
                    variant={isFollowing ? 'outline' : 'default'}
                    size="sm"
                  >
                    {followLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    ) : isFollowing ? (
                      <>
                        <Users className="h-4 w-4 mr-2" />
                        Following
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
                <Badge variant="secondary">Active</Badge>
              </div>
            </div>

            {mosque.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {mosque.description}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mosque.phone && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{mosque.phone}</span>
                </div>
              )}

              {mosque.email && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{mosque.email}</span>
                </div>
              )}

              {mosque.website && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Globe className="h-4 w-4 mr-2" />
                  <a
                    href={mosque.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 transition-colors"
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>

            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                      No upcoming events
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {events.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className="border-l-4 border-blue-500 pl-3"
                        >
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {event.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDateTime(event.event_date)}
                          </p>
                          {event.location && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              📍 {event.location}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>


            </div>
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Events</CardTitle>
                <CardDescription>
                  Upcoming events and programs at {mosque.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No events scheduled
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {events.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onRegister={handleRegisterForEvent}
                        hasAdminAccess={false}
                        userRegistered={userRegistrations.includes(event.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>



          <TabsContent value="contact" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  Get in touch with {mosque.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mosque.address && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        Address
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        {mosque.address}
                      </p>
                    </div>
                  )}

                  {mosque.phone && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        Phone
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        {mosque.phone}
                      </p>
                    </div>
                  )}

                  {mosque.email && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        {mosque.email}
                      </p>
                    </div>
                  )}

                  {mosque.website && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                        <Globe className="h-4 w-4 mr-2" />
                        Website
                      </h4>
                      <a
                        href={mosque.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {mosque.website}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      

    </div>
  );
}
