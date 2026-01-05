/**
 * Get the correct dashboard URL based on user's admin status
 * This utility helps ensure users are redirected to the right dashboard
 */

/**
 * Get dashboard URL for a user
 * @param userId - User ID to check admin status
 * @returns Promise<string> - '/dashboard' for admins, '/my-dashboard' for regular users
 */
export async function getDashboardUrl(userId?: string | null): Promise<string> {
  if (!userId) {
    return '/my-dashboard'; // Default to user dashboard if no user
  }

  try {
    const { supabase } = await import('@/lib/supabase');
    const { data: mosqueData } = await supabase
      .from('mosques')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    return mosqueData ? '/dashboard' : '/my-dashboard';
  } catch (error) {
    console.error('Error checking admin status for dashboard URL:', error);
    return '/my-dashboard'; // Default to user dashboard on error
  }
}

/**
 * Get dashboard URL synchronously (for client-side use with hooks)
 * This requires the admin status to be passed in
 * @param hasAdminAccess - Whether user has admin access
 * @returns '/dashboard' for admins, '/my-dashboard' for regular users
 */
export function getDashboardUrlSync(hasAdminAccess: boolean): string {
  return hasAdminAccess ? '/dashboard' : '/my-dashboard';
}

