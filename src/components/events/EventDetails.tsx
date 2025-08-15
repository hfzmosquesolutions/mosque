'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  UserCheck,
  Edit,
  Trash2,
  AlertCircle,
  Share2,
} from 'lucide-react';
import type { Event } from '@/types/database';

interface EventDetailsProps {
  event: Event;
  open: boolean;
  onClose: () => void;
  onRegister?: (eventId: string) => void;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  hasAdminAccess?: boolean;
  userRegistered?: boolean;
}

export function EventDetails({
  event,
  open,
  onClose,
  onRegister,
  onEdit,
  onDelete,
  hasAdminAccess = false,
  userRegistered = false,
}: EventDetailsProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const isUpcoming = new Date(event.event_date) > new Date();
  const isPast = new Date(event.event_date) < new Date();

  // Check if registration is still open
  const registrationOpen =
    event.registration_required &&
    (!event.registration_deadline ||
      new Date(event.registration_deadline) > new Date());

  const handleRegister = async () => {
    if (!onRegister) return;

    setIsRegistering(true);
    try {
      await onRegister(event.id);
    } catch (error) {
      console.error('Failed to register for event:', error);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    try {
      await onDelete(event.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description || `Join us for ${event.title}`,
          url: window.location.href,
        });
      } catch {
        // Fallback to clipboard
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getStatusBadge = () => {
    if (event.status === 'cancelled') {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    if (event.status === 'draft') {
      return <Badge variant="secondary">Draft</Badge>;
    }
    if (isPast) {
      return <Badge variant="outline">Completed</Badge>;
    }
    if (isUpcoming) {
      return <Badge variant="default">Upcoming</Badge>;
    }
    return null;
  };

  const getCategoryBadge = () => {
    if (!event.category) return null;

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

  if (showDeleteConfirm) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{event.title}&quot;? This
              action cannot be undone. All registrations for this event will
              also be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {getStatusBadge()}
                {getCategoryBadge()}
              </div>
              <DialogTitle className="text-2xl">{event.title}</DialogTitle>
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
                    onClick={() => onEdit?.(event)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Image */}
          {event.image_url && (
            <div className="relative h-64 overflow-hidden rounded-lg">
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2">About This Event</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          <div className="border-t pt-4" />

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date and Time */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Date & Time
              </h3>

              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Starts: {formatDateTime(event.event_date)}</span>
                </div>

                {event.end_date && (
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Ends: {formatDateTime(event.end_date)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Location
              </h3>

              {event.location ? (
                <p className="text-sm">{event.location}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Location not specified
                </p>
              )}
            </div>
          </div>

          {/* Registration Information */}
          {event.registration_required && (
            <>
              <div className="border-t pt-4" />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Registration
                </h3>

                <div className="space-y-2">
                  {event.max_attendees && (
                    <p className="text-sm">
                      <strong>Maximum Attendees:</strong> {event.max_attendees}
                    </p>
                  )}

                  {event.registration_deadline && (
                    <p className="text-sm">
                      <strong>Registration Deadline:</strong>{' '}
                      {formatDateTime(event.registration_deadline)}
                    </p>
                  )}

                  {!registrationOpen && isUpcoming && (
                    <div className="flex items-center text-sm text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <span>Registration deadline has passed</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {!hasAdminAccess &&
              event.registration_required &&
              isUpcoming &&
              registrationOpen &&
              !userRegistered && (
                <Button
                  onClick={handleRegister}
                  disabled={isRegistering}
                  className="flex-1"
                >
                  {isRegistering ? (
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <UserCheck className="h-4 w-4 mr-2" />
                  )}
                  {isRegistering ? 'Registering...' : 'Register for Event'}
                </Button>
              )}

            {userRegistered && (
              <Button variant="secondary" disabled className="flex-1">
                <UserCheck className="h-4 w-4 mr-2" />
                You&apos;re Registered
              </Button>
            )}

            {event.registration_required &&
              (!registrationOpen || isPast) &&
              !userRegistered && (
                <Button variant="secondary" disabled className="flex-1">
                  Registration Closed
                </Button>
              )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
