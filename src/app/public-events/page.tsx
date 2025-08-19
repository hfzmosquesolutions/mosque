'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAllEvents } from '@/lib/api';
import { Event } from '@/types/database';
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
import { Calendar, MapPin, Search, Users } from 'lucide-react';
// No import needed - we'll define these functions locally

type EventWithMosque = Event & { mosque: { name: string; id: string } };
import { FEATURES } from '@/lib/utils';

export default function PublicEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventWithMosque[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  });

  // Fetch events
  const fetchEvents = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const offset = (page - 1) * pagination.limit;
      const response = await getAllEvents(pagination.limit, offset);

      setEvents(response.data);
      setPagination({
        page: response.page,
        limit: response.limit,
        total_pages: response.total_pages,
        has_next: response.has_next,
        has_prev: response.has_prev,
      });
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    if (FEATURES.EVENTS_ENABLED) {
      fetchEvents();
    }
  }, [pagination.limit, fetchEvents]);

  // Check if events feature is enabled
  if (!FEATURES.EVENTS_ENABLED) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Events Unavailable</CardTitle>
            <CardDescription>Event features are temporarily disabled.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Filter events based on search and tab
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.mosque.name.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by tab
    const now = new Date();
    const eventDate = new Date(event.event_date);

    if (activeTab === 'upcoming') {
      return matchesSearch && eventDate >= now;
    } else if (activeTab === 'past') {
      return matchesSearch && eventDate < now;
    }

    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (dateString: string) => {
    return `${formatDate(dateString)} at ${formatTime(dateString)}`;
  };

  const handleEventClick = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  const handleMosqueClick = (mosqueId: string) => {
    router.push(`/mosques/${mosqueId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            All Mosque Events
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover events and programs from mosques in your community
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search events or mosques..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past Events</TabsTrigger>
            <TabsTrigger value="all">All Events</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No events found
                    </h3>
                    <p className="text-muted-foreground">
                      {activeTab === 'upcoming'
                        ? 'No upcoming events scheduled.'
                        : activeTab === 'past'
                        ? 'No past events found.'
                        : 'No events match your search criteria.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle
                            className="text-lg mb-2 line-clamp-2"
                            onClick={() => handleEventClick(event.id)}
                          >
                            {event.title}
                          </CardTitle>
                          <Button
                            variant="link"
                            className="p-0 h-auto text-sm text-primary hover:underline"
                            onClick={() => handleMosqueClick(event.mosque.id)}
                          >
                            {event.mosque.name}
                          </Button>
                        </div>
                        <Badge
                          variant={event.category ? 'secondary' : 'outline'}
                        >
                          {event.category || 'General'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent
                      className="space-y-4"
                      onClick={() => handleEventClick(event.id)}
                    >
                      {event.description && (
                        <CardDescription className="line-clamp-3">
                          {event.description}
                        </CardDescription>
                      )}

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDateTime(event.event_date)}</span>
                        </div>

                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="line-clamp-1">
                              {event.location}
                            </span>
                          </div>
                        )}

                        {event.max_attendees && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>Max {event.max_attendees} attendees</span>
                          </div>
                        )}
                      </div>

                      {event.registration_required && (
                        <div className="pt-2">
                          <Badge variant="outline" className="text-xs">
                            Registration Required
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <Button
                  variant="outline"
                  onClick={() => fetchEvents(pagination.page - 1)}
                  disabled={!pagination.has_prev || loading}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.total_pages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => fetchEvents(pagination.page + 1)}
                  disabled={!pagination.has_next || loading}
                >
                  Next
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
