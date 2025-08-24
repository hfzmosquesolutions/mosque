// Notification System API Functions
// Handles user notifications - fetch, mark as read, delete, etc.

import { supabase } from '../supabase';
import type { Notification } from '../../types/database';

// =============================================
// NOTIFICATION MANAGEMENT
// =============================================

/**
 * Fetch user notifications with pagination and filtering
 */
export async function getUserNotifications(
  page = 1,
  limit = 20,
  unreadOnly = false
) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const offset = (page - 1) * limit;
  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', user.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }

  return {
    data: data || [],
    count: count || 0,
    page,
    limit,
    total_pages: Math.ceil((count || 0) / limit),
    has_next: (count || 0) > offset + limit,
    has_prev: page > 1
  };
}

/**
 * Get unread notification count for the current user
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    return 0;
  }

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.user.id)
    .eq('is_read', false);

  if (error) {
    console.error('Failed to get unread notification count:', error.message);
    return 0;
  }

  return count || 0;
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('id', notificationId)
    .eq('user_id', user.user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }

  return data;
}

/**
 * Mark all notifications as read for the current user
 */
export async function markAllNotificationsAsRead() {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('user_id', user.user.id)
    .eq('is_read', false);

  if (error) {
    throw new Error(`Failed to mark all notifications as read: ${error.message}`);
  }

  return true;
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.user.id);

  if (error) {
    throw new Error(`Failed to delete notification: ${error.message}`);
  }

  return true;
}

/**
 * Delete all read notifications for the current user
 */
export async function deleteReadNotifications() {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', user.user.id)
    .eq('is_read', true);

  if (error) {
    throw new Error(`Failed to delete read notifications: ${error.message}`);
  }

  return true;
}

/**
 * Create a new notification (typically used by admin/system)
 */
export async function createNotification(notification: {
  user_id: string;
  mosque_id?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  action_url?: string;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      ...notification,
      is_read: false,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }

  return data;
}

/**
 * Get notification types with their corresponding icons and colors
 */
export function getNotificationTypeConfig(type: 'info' | 'warning' | 'success' | 'error') {
  const configs = {
    info: {
      icon: 'Info',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    success: {
      icon: 'CheckCircle',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    warning: {
      icon: 'AlertTriangle',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    error: {
      icon: 'AlertCircle',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  };

  return configs[type] || configs.info;
}