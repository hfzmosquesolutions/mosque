'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import type { Event } from '@/types/database';

interface EventCardProps {
  event: Event;
  onRegister?: (eventId: string) => void;
  onViewDetails?: (event: Event) => void; // Deprecated: EventCard now opens details in new tab
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  hasAdminAccess?: boolean;
  userRegistered?: boolean;
}

export function EventCard({
  event,
  onRegister,
  onViewDetails,
  onEdit,
  onDelete,
  hasAdminAccess = false,
  userRegistered = false,
}: EventCardProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();

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

  const isUpcoming = new Date(event.event_date) > new Date();
  const isPast = new Date(event.event_date) < new Date();

  // Check if registration is still open
  const registrationOpen =
    event.registration_required &&
    (!event.registration_deadline ||
      new Date(event.registration_deadline) > new Date());

  const handleRegister = async () => {
    if (onRegister) {
      setIsRegistering(true);
      try {
        await onRegister(event.id);
      } finally {
        setIsRegistering(false);
      }
    }
  };

  const handleViewDetails = () => {
    // Open event details in new tab
    window.open(`/events/${event.id}`, '_blank');
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

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-all duration-200 border-slate-200 dark:border-slate-800">
      {/* Compact Header with Image */}
      {event.image_url && (
        <div className="relative h-32 overflow-hidden rounded-t-lg">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute top-2 right-2">
            {getStatusBadge()}
          </div>
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {!event.image_url && getStatusBadge()}
              {getCategoryBadge()}
            </div>
            <h3 className="font-semibold text-base line-clamp-2 text-slate-900 dark:text-slate-100">
              {event.title}
            </h3>
          </div>

          {hasAdminAccess && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleViewDetails}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(event)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Event
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(event.id)}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Event
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
            {event.description}
          </p>
        )}

        {/* Compact Event Details */}
        <div className="space-y-2 mb-4 flex-1">
          {/* Date and Time - Combined */}
          <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
            <Calendar className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
            <span className="truncate">
              {formatDate(event.event_date)} • {formatTime(event.event_date)}
              {event.end_date && ` - ${formatTime(event.end_date)}`}
            </span>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
              <MapPin className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {/* Registration Info - Compact */}
          {event.registration_required && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-slate-600 dark:text-slate-400">
                <Users className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                <span>
                  {event.max_attendees ? `Max ${event.max_attendees}` : 'Registration required'}
                </span>
              </div>
              {event.registration_deadline && isUpcoming && (
                <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Due {formatDate(event.registration_deadline)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Compact Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewDetails}
            className="flex-1 h-8 text-xs"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Details
          </Button>

          {/* Registration Button */}
          {!hasAdminAccess &&
            event.registration_required &&
            isUpcoming &&
            registrationOpen &&
            !userRegistered && (
              <Button
                size="sm"
                onClick={handleRegister}
                disabled={isRegistering}
                className="flex-1 h-8 text-xs"
              >
                {isRegistering ? (
                  <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <UserCheck className="h-3 w-3 mr-1" />
                )}
                {isRegistering ? 'Registering...' : 'Register'}
              </Button>
            )}

          {/* Already Registered */}
          {userRegistered && (
            <Button size="sm" variant="secondary" disabled className="flex-1 h-8 text-xs">
              <UserCheck className="h-3 w-3 mr-1" />
              Registered
            </Button>
          )}

          {/* Registration Closed */}
          {event.registration_required &&
            (!registrationOpen || isPast) &&
            !userRegistered && (
              <Button size="sm" variant="secondary" disabled className="flex-1 h-8 text-xs">
                Closed
              </Button>
            )}
        </div>
      </div>
    </Card>
  );
}
