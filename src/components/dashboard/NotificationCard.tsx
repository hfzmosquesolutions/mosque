'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  Info,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Users,
  Heart,
  Calendar,
  Megaphone,
  Settings,
  UserPlus,
  CreditCard,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '@/lib/api/notifications';
import type { Notification, NotificationCategory } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCardProps {
  className?: string;
}

// Get icon for notification category
function getCategoryIcon(category?: NotificationCategory) {
  switch (category) {
    case 'kariah_application':
      return UserPlus;
    case 'contribution':
      return Heart;
    case 'donation':
      return CreditCard;
    case 'event':
      return Calendar;
    case 'announcement':
      return Megaphone;
    case 'system':
      return Settings;
    case 'following':
      return Users;
    case 'membership':
      return Users;
    case 'payment':
      return CreditCard;
    default:
      return Bell;
  }
}

// Get type icon for notification type
function getTypeIcon(type: 'info' | 'warning' | 'success' | 'error') {
  switch (type) {
    case 'success':
      return CheckCircle;
    case 'warning':
      return AlertTriangle;
    case 'error':
      return AlertCircle;
    default:
      return Info;
  }
}

// Get type color classes
function getTypeColors(type: 'info' | 'warning' | 'success' | 'error') {
  switch (type) {
    case 'success':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'error':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-blue-600 bg-blue-50 border-blue-200';
  }
}

export function NotificationCard({ className }: NotificationCardProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // Fetch notifications and unread count
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const [notificationsData, unreadCountData] = await Promise.all([
        getUserNotifications(1, showAll ? 20 : 5),
        getUnreadNotificationCount()
      ]);
      
      setNotifications(notificationsData.data);
      setUnreadCount(unreadCountData);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [showAll]);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Delete notification
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  if (loading) {
    return (
      <Card className={`border-0 shadow-md hover:shadow-lg transition-shadow duration-200 ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Notifications
          </CardTitle>
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-0 shadow-md hover:shadow-lg transition-shadow duration-200 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Notifications
          </CardTitle>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="h-5 px-2 text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-8 px-2 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            {unreadCount > 0 ? (
              <BellRing className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className={showAll ? "h-96" : "h-auto"}>
            <div className="space-y-3">
              {notifications.map((notification, index) => {
                const CategoryIcon = getCategoryIcon(notification.category);
                const TypeIcon = getTypeIcon(notification.type);
                const typeColors = getTypeColors(notification.type);
                
                return (
                  <div key={notification.id}>
                    <div className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                      notification.is_read 
                        ? 'bg-muted/30' 
                        : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    }`}>
                      <div className={`p-2 rounded-full ${typeColors}`}>
                        <CategoryIcon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-medium truncate ${
                              notification.is_read ? 'text-muted-foreground' : 'text-foreground'
                            }`}>
                              {notification.title}
                            </h4>
                            <p className={`text-xs mt-1 line-clamp-2 ${
                              notification.is_read ? 'text-muted-foreground/70' : 'text-muted-foreground'
                            }`}>
                              {notification.message}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                              {notification.category && (
                                <Badge variant="outline" className="text-xs px-1 py-0">
                                  {notification.category.replace('_', ' ')}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < notifications.length - 1 && <Separator className="my-2" />}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
        
        {notifications.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="w-full text-xs"
            >
              {showAll ? 'Show less' : 'View all notifications'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}