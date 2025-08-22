'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Eye,
  Edit,
  UserCheck,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAdminAccess, useUserMosque } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import {
  getEvents,
  getUserEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  isUserRegisteredForEvent,
} from '@/lib/api';
import type { Event, EventFormData } from '@/types/database';
import { EventForm } from '@/components/events/EventForm';
import { EventCard } from '@/components/events/EventCard';
import { FEATURES } from '@/lib/utils';

function EventsContent() {
  const t = useTranslations('events');
  const tCommon = useTranslations('common');
  const { user } = useAuth();
  const { hasAdminAccess } = useAdminAccess();
  const { mosqueId } = useUserMosque();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRegistrations, setUserRegistrations] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  });

  // Fetch user registrations
  const fetchUserRegistrations = useCallback(async () => {
    if (!user) return;

    try {
      const registrations: string[] = [];
      for (const event of events) {
        const isRegistered = await isUserRegisteredForEvent(user.id, event.id);
        if (isRegistered) {
          registrations.push(event.id);
        }
      }
      setUserRegistrations(registrations);
    } catch (error) {
      console.error('Failed to fetch user registrations:', error);
    }
  }, [user, events]);

  // Fetch events
  const fetchEvents = useCallback(async (page = 1) => {
    if (!user) return;

    try {
      setLoading(true);
      const offset = (page - 1) * pagination.limit;

      let response;
      if (hasAdminAccess && mosqueId) {
        // For mosque admins, get mosque events
        response = await getEvents(mosqueId, pagination.limit, offset);
      } else {
        // For normal users, get their personal events
        response = await getUserEvents(user.id, pagination.limit, offset);
      }

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
  }, [user, hasAdminAccess, mosqueId, pagination.limit]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (events.length > 0 && user && !hasAdminAccess) {
      fetchUserRegistrations();
    }
  }, [events, user, hasAdminAccess, fetchUserRegistrations]);

  // Filter events based on search, filters, and active tab
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || event.status === statusFilter;
    const matchesCategory =
      categoryFilter === 'all' || event.category === categoryFilter;

    // Filter by tab
    const now = new Date();
    const eventDate = new Date(event.event_date);
    let matchesTab = true;
    
    if (activeTab === 'upcoming') {
      matchesTab = eventDate >= now;
    } else if (activeTab === 'past') {
      matchesTab = eventDate < now;
    }
    // 'all' tab shows all events

    return matchesSearch && matchesStatus && matchesCategory && matchesTab;
  });

  // Handle event creation
  const handleCreateEvent = async (eventData: EventFormData) => {
    if (!mosqueId || !user) return;

    try {
      const response = await createEvent({
        ...eventData,
        mosque_id: mosqueId,
        created_by: user.id,
        status: 'published',
      });

      if (response.success) {
        setShowCreateDialog(false);
        fetchEvents(); // Refresh events
      }
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  // Handle event registration
  const handleRegisterForEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const response = await registerForEvent(eventId, user.id);
      if (response.success) {
        // Update user registrations state
        setUserRegistrations((prev) => [...prev, eventId]);
        // Refresh events to update registration status
        fetchEvents();
      }
    } catch (error) {
      console.error('Failed to register for event:', error);
    }
  };

  // Handle event editing
  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowEditDialog(true);
  };

  // Handle event update
  const handleUpdateEvent = async (eventData: EventFormData) => {
    if (!editingEvent || !mosqueId || !user) return;

    try {
      const response = await updateEvent(editingEvent.id, {
        ...eventData,
        mosque_id: mosqueId,
      });

      if (response.success) {
        setShowEditDialog(false);
        setEditingEvent(null);
        fetchEvents(); // Refresh events
      }
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  // Handle event deletion
  const handleDeleteEvent = async (eventId: string) => {
    if (
      !confirm(
        t('deleteEventConfirmation')
      )
    ) {
      return;
    }

    try {
      const response = await deleteEvent(eventId);
      if (response.success) {
        // Refresh events list
        fetchEvents();
      } else {
        console.error('Failed to delete event:', response.error);
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  // Format date for display


  // Get unique categories for filter
  const categories = Array.from(
    new Set(events.map((event) => event.category).filter(Boolean))
  );

  if (loading) {
    return (
      <DashboardLayout title={t('title')}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('loadingEvents')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate summary statistics
  const upcomingEvents = events.filter(event => new Date(event.event_date) >= new Date());
  const pastEvents = events.filter(event => new Date(event.event_date) < new Date());
  const registeredEvents = events.filter(event => userRegistrations.includes(event.id));
  const draftEvents = events.filter(event => event.status === 'draft');

  return (
    <DashboardLayout title={t('title')}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl" />
          <div className="relative p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <p className="text-muted-foreground text-lg">
                  {hasAdminAccess
                    ? t('manageEvents')
                    : t('accessEvents')}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Activity className="h-4 w-4" />
                    <span>{t('totalEventsCount', { count: events.length })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <UserCheck className="h-4 w-4" />
                    <span>{t('registeredCount', { count: userRegistrations.length })}</span>
                  </div>
                </div>
              </div>
              {hasAdminAccess && (
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      {t('createEvent')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{t('createEvent')}</DialogTitle>
                      <DialogDescription>
                        {t('createEventDescription')}
                      </DialogDescription>
                    </DialogHeader>
                    <EventForm onSubmit={handleCreateEvent} />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('upcoming')}
              </CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {upcomingEvents.length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t('upcomingEventsCount')}
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('past')}
              </CardTitle>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {pastEvents.length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t('pastEventsCount')}
              </p>
            </CardContent>
          </Card>
          
          {!hasAdminAccess && (
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('registered')}
                </CardTitle>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <UserCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {registeredEvents.length}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('eventsYouJoined')}
                </p>
              </CardContent>
            </Card>
          )}
          
          {hasAdminAccess && (
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('draft')}
                </CardTitle>
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Edit className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {draftEvents.length}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('unpublishedEvents')}
                </p>
              </CardContent>
            </Card>
          )}
          
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('totalEvents')}
              </CardTitle>
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <TrendingUp className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-700 dark:text-slate-300">
                {events.length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t('allEventsManaged')}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="upcoming">{t('upcoming')}</TabsTrigger>
            <TabsTrigger value="past">{t('past')}</TabsTrigger>
            <TabsTrigger value="all">{t('allEvents')}</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {/* Enhanced Filters */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {t('filterEvents')}
                </CardTitle>
                <CardDescription>
                  {t('filterEventsDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t('searchEventsPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder={t('filterByStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allStatus')}</SelectItem>
                      <SelectItem value="published">{t('published')}</SelectItem>
                      <SelectItem value="draft">{t('draft')}</SelectItem>
                      <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder={t('filterByCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allCategories')}</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category!}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Events List */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {t('eventsList')}
                    </CardTitle>
                    <CardDescription>
                      {t('showingEvents', { start: filteredEvents.length, end: filteredEvents.length, total: events.length })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
                    <span className="text-muted-foreground">
                      {t('loadingEvents')}
                    </span>
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                      {events.length === 0
                        ? t('noEventsYet')
                        : t('noMatchingResults')}
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-4">
                      {events.length === 0
                        ? hasAdminAccess
                          ? t('noEventsAdminMessage')
                          : t('noEventsUserMessage')
                        : t('noEventsMatchSearch')}
                    </p>
                    {events.length === 0 && (
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {hasAdminAccess ? (
                          <Button onClick={() => setShowCreateDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            {t('createFirstEvent')}
                          </Button>
                        ) : (
                          <Button
                            onClick={() => window.open('/public-events', '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {t('browsePublicEvents')}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onRegister={handleRegisterForEvent}
                        onEdit={handleEditEvent}
                        onDelete={handleDeleteEvent}
                        hasAdminAccess={hasAdminAccess}
                        userRegistered={userRegistrations.includes(event.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Event Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('editEvent')}</DialogTitle>
              <DialogDescription>
                {t('editEventDescription')}
              </DialogDescription>
            </DialogHeader>
            {editingEvent && (
              <EventForm
                onSubmit={handleUpdateEvent}
                initialData={{
                  title: editingEvent.title,
                  description: editingEvent.description || '',
                  event_date: editingEvent.event_date,
                  end_date: editingEvent.end_date || '',
                  location: editingEvent.location || '',
                  category: editingEvent.category || '',
                  max_attendees: editingEvent.max_attendees || 0,
                  registration_required:
                    editingEvent.registration_required || false,
                  registration_deadline:
                    editingEvent.registration_deadline || '',
                  image_url: editingEvent.image_url || '',
                }}
              />
            )}
          </DialogContent>
        </Dialog>



        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => fetchEvents(pagination.page - 1)}
              disabled={!pagination.has_prev}
            >
              {tCommon('previous')}
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              {t('pageInfo', { current: pagination.page, total: pagination.total_pages })}
            </span>
            <Button
              variant="outline"
              onClick={() => fetchEvents(pagination.page + 1)}
              disabled={!pagination.has_next}
            >
              {tCommon('next')}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function EventsPage() {
  const t = useTranslations('events');
  
  if (!FEATURES.EVENTS_ENABLED) {
    return (
      <DashboardLayout>
        <Card>
          <CardHeader>
            <CardTitle>{t('featureUnavailableTitle')}</CardTitle>
            <CardDescription>{t('featureUnavailableDescription')}</CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    );
  }
  return (
    <ProtectedRoute>
      <EventsContent />
    </ProtectedRoute>
  );
}
