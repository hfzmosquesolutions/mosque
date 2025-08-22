'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  UserCheck,
  ArrowLeft,
  Share2,
  AlertCircle,
  Edit,
  Trash2,
} from 'lucide-react';
import { EventForm } from '@/components/events/EventForm';
import { useAdminAccess } from '@/hooks/useUserRole';
import type { Event, EventFormData } from '@/types/database';
import {
  getEventById,
  registerForEvent,
  updateEvent,
  deleteEvent,
  isUserRegisteredForEvent,
} from '@/lib/api';
import { toast } from 'sonner';
import { FEATURES } from '@/lib/utils';

function EventDetailsContent() {
  const t = useTranslations('events');
  const tCommon = useTranslations('common');
  const { user } = useAuth();
  const { hasAdminAccess } = useAdminAccess();
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [userRegistered, setUserRegistered] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const loadEvent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getEventById(eventId);

      if (!response.success || !response.data) {
        setError(response.error || 'Event not found');
        return;
      }

      setEvent(response.data);
    } catch (err) {
      setError('Failed to load event');
      console.error('Error loading event:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const checkUserRegistration = useCallback(async () => {
    if (!user || !event) return;

    try {
      const isRegistered = await isUserRegisteredForEvent(user.id, event.id);
      setUserRegistered(isRegistered);
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  }, [user, event]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  useEffect(() => {
    if (user && event) {
      checkUserRegistration();
    }
  }, [user, event, checkUserRegistration]);

  const handleRegister = async () => {
    if (!event) return;
    
    if (!user) {
      // Redirect to login if user is not authenticated
      router.push('/login');
      return;
    }

    setIsRegistering(true);
    try {
      const response = await registerForEvent(event.id, user.id);
      if (response.success) {
        setUserRegistered(true);
        toast.success(t('eventRegistered'));
      } else {
        toast.error(response.error || t('registerFailed'));
      }
    } catch (error) {
      console.error('Failed to register for event:', error);
      toast.error(t('registerFailed'));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleEdit = async (formData: EventFormData) => {
    if (!event) return;

    try {
      const response = await updateEvent(event.id, formData);
      if (response.success) {
        setShowEditForm(false);
        toast.success(t('eventUpdated'));
        loadEvent();
      } else {
        toast.error(response.error || t('updateFailed'));
      }
    } catch (error) {
      console.error('Failed to update event:', error);
      toast.error(t('updateFailed'));
    }
  };

  const handleDelete = async () => {
    if (!event) return;

    if (
      confirm(
        `${t('deleteEventConfirmation')} "${event.title}"? ${t('actionCannotBeUndone')}`
      )
    ) {
      try {
        const response = await deleteEvent(event.id);
        if (response.success) {
          toast.success(t('eventDeleted'));
          router.push('/events');
        } else {
          toast.error(response.error || t('deleteFailed'));
        }
      } catch (error) {
        console.error('Failed to delete event:', error);
        toast.error(t('deleteFailed'));
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: event?.description || `${t('joinUsFor')} ${event?.title}`,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to clipboard if share fails or is cancelled
        if (error instanceof Error && error.name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t('linkCopied'));
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error(t('copyFailed'));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  const getStatusBadge = () => {
    if (!event) return null;

    const isPast = new Date(event.event_date) < new Date();

    if (event.status === 'cancelled') {
      return <Badge variant="destructive">{t('cancelled')}</Badge>;
    }
    if (event.status === 'draft') {
      return <Badge variant="secondary">{t('draft')}</Badge>;
    }
    if (isPast) {
      return <Badge variant="outline">{t('completed')}</Badge>;
    }
    return <Badge variant="default">{t('upcoming')}</Badge>;
  };

  const getCategoryBadge = () => {
    if (!event?.category) return null;

    const categoryColors: Record<string, string> = {
      religious:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      educational:
        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      community:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      youth:
        'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      women: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      charity: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      cultural:
        'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      social:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      health: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    };

    const colorClass =
      categoryColors[event.category.toLowerCase()] || categoryColors.other;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}
      >
        {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('eventNotFoundTitle')}</h1>
          <p className="text-muted-foreground mb-6">
            {error || t('eventNotFoundDescription')}
          </p>
          <Button onClick={() => router.push('/public-events')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('backToEvents')}
          </Button>
        </div>
      </div>
    );
  }

  const isUpcoming = new Date(event.event_date) > new Date();
  const isPast = new Date(event.event_date) < new Date();
  const registrationOpen =
    event.registration_required &&
    (!event.registration_deadline ||
      new Date(event.registration_deadline) > new Date());

  if (showEditForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="outline" onClick={() => setShowEditForm(false)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tCommon('cancel')}
          </Button>
        </div>

        <EventForm
          initialData={event}
          onSubmit={handleEdit}
          onCancel={() => setShowEditForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/public-events')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('backToEvents')}
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge()}
              {getCategoryBadge()}
            </div>
            <h1 className="text-3xl font-bold">{event.title}</h1>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>

            {hasAdminAccess && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditForm(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Image */}
          {event.image_url && (
            <div className="relative h-64 md:h-80 overflow-hidden rounded-lg">
              <Image
                src={event.image_url}
                alt={event.title}
                fill
                className="object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Description */}
          {event.description && (
            <Card>
              <CardHeader>
                <CardTitle>{t('aboutThisEvent')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {event.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t('eventDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date and Time */}
              <div>
                <h4 className="font-semibold flex items-center mb-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  {t('dateAndTime')}
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-2 text-muted-foreground" />
                    <span>{t('starts')}: {formatDateTime(event.event_date)}</span>
                  </div>
                  {event.end_date && (
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-2 text-muted-foreground" />
                      <span>{t('ends')}: {formatDateTime(event.end_date)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div>
                <h4 className="font-semibold flex items-center mb-2">
                  <MapPin className="h-4 w-4 mr-2" />
                  {tCommon('location')}
                </h4>
                {event.location ? (
                  <p className="text-sm">{event.location}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t('locationNotSpecified')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Registration */}
          {event.registration_required && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  {t('registration')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  {event.max_attendees && (
                    <p>
                      <strong>{t('maximumAttendees')}:</strong> {event.max_attendees}
                    </p>
                  )}

                  {event.registration_deadline && (
                    <p>
                      <strong>{t('registrationDeadline')}:</strong>{' '}
                      {formatDateTime(event.registration_deadline)}
                    </p>
                  )}

                  {!registrationOpen && isUpcoming && (
                    <div className="flex items-center text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-3 w-3 mr-2" />
                      <span>{t('registrationDeadlinePassed')}</span>
                    </div>
                  )}
                </div>

                {/* Registration Button */}
                <div className="pt-2">
                  {!hasAdminAccess &&
                    isUpcoming &&
                    registrationOpen &&
                    !userRegistered && (
                      <Button
                        onClick={handleRegister}
                        disabled={isRegistering}
                        className="w-full"
                      >
                        {isRegistering ? (
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <UserCheck className="h-4 w-4 mr-2" />
                        )}
                        {isRegistering
                          ? t('registering')
                          : user ? t('registerForEvent') : t('loginToRegister')}
                      </Button>
                    )}

                  {user && userRegistered && (
                    <Button variant="secondary" disabled className="w-full">
                      <UserCheck className="h-4 w-4 mr-2" />
                      {t('youAreRegistered')}
                    </Button>
                  )}

                  {(!registrationOpen || isPast) && !(user && userRegistered) && (
                    <Button variant="secondary" disabled className="w-full">
                      {t('registrationClosed')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EventDetailsPage() {
  const t = useTranslations('events');
  
  if (!FEATURES.EVENTS_ENABLED) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('featureUnavailableTitle')}</CardTitle>
            <CardDescription>{t('featureUnavailableDescription')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  return <EventDetailsContent />;
}
