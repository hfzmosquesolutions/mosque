import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = getSupabaseAdmin();

    // Authenticate user from access token
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Get user profile information before deletion (for preserving mosque ownership records)
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    const userFullName = userProfile?.full_name || user.user_metadata?.full_name || user.email || 'Unknown';

    // Best-effort cleanup of user-related data.
    // We intentionally keep contribution/payment history for mosque records,
    // as documented in the profile docs.
    const cleanupErrors: string[] = [];

    // Delete user subscriptions (references auth.users directly)
    const { error: subscriptionsError } = await supabaseAdmin
      .from('user_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (subscriptionsError) {
      console.error('[DELETE /api/account/delete] Error deleting subscriptions:', subscriptionsError);
      cleanupErrors.push('subscriptions');
    }

    // Delete user subscription invoices (references auth.users directly)
    const { error: invoicesError } = await supabaseAdmin
      .from('user_subscription_invoices')
      .delete()
      .eq('user_id', userId);

    if (invoicesError) {
      console.error('[DELETE /api/account/delete] Error deleting subscription invoices:', invoicesError);
      cleanupErrors.push('subscription_invoices');
    }

    // Delete user followers (references auth.users for both follower_id and following_id)
    const { error: followersError1 } = await supabaseAdmin
      .from('user_followers')
      .delete()
      .eq('follower_id', userId);

    if (followersError1) {
      console.error('[DELETE /api/account/delete] Error deleting user followers (follower):', followersError1);
      cleanupErrors.push('user_followers_follower');
    }

    const { error: followersError2 } = await supabaseAdmin
      .from('user_followers')
      .delete()
      .eq('following_id', userId);

    if (followersError2) {
      console.error('[DELETE /api/account/delete] Error deleting user followers (following):', followersError2);
      cleanupErrors.push('user_followers_following');
    }

    // Delete mosque followers (references auth.users directly)
    const { error: mosqueFollowersError } = await supabaseAdmin
      .from('mosque_followers')
      .delete()
      .eq('user_id', userId);

    if (mosqueFollowersError) {
      console.error('[DELETE /api/account/delete] Error deleting mosque followers:', mosqueFollowersError);
      cleanupErrors.push('mosque_followers');
    }

    // Delete user dependents
    const { error: dependentsError } = await supabaseAdmin
      .from('user_dependents')
      .delete()
      .eq('user_id', userId);

    if (dependentsError) {
      console.error('[DELETE /api/account/delete] Error deleting dependents:', dependentsError);
      cleanupErrors.push('dependents');
    }

    // Delete user notifications
    const { error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (notificationsError) {
      console.error('[DELETE /api/account/delete] Error deleting notifications:', notificationsError);
      cleanupErrors.push('notifications');
    }

    // Preserve mosque ownership information before removing ownership
    // Store original owner info in settings for future ownership transfer
    const { data: ownedMosques } = await supabaseAdmin
      .from('mosques')
      .select('id, settings')
      .eq('user_id', userId);

    if (ownedMosques && ownedMosques.length > 0) {
      for (const mosque of ownedMosques) {
        const currentSettings = (mosque.settings as Record<string, unknown>) || {};
        const updatedSettings = {
          ...currentSettings,
          previous_owner: {
            user_id: userId,
            full_name: userFullName,
            email: user.email,
            removed_at: new Date().toISOString(),
            reason: 'account_deletion'
          }
        };

        const { error: mosqueUpdateError } = await supabaseAdmin
          .from('mosques')
          .update({ 
            user_id: null,
            settings: updatedSettings
          })
          .eq('id', mosque.id);

        if (mosqueUpdateError) {
          console.error(`[DELETE /api/account/delete] Error updating mosque ${mosque.id}:`, mosqueUpdateError);
          cleanupErrors.push(`mosque_${mosque.id}`);
        }
      }
    }

    // Delete user profile (must be deleted before auth.users due to foreign key)
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('[DELETE /api/account/delete] Error deleting profile:', profileError);
      cleanupErrors.push('profile');
    }

    // Finally, delete the auth user (revokes all access)
    // This should cascade delete any remaining references
    const { error: deleteUserError } =
      await (supabaseAdmin as any).auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error('[DELETE /api/account/delete] Error deleting auth user:', deleteUserError);
      console.error('[DELETE /api/account/delete] Cleanup errors encountered:', cleanupErrors);
      return NextResponse.json(
        { 
          error: 'Failed to delete account',
          details: deleteUserError.message || 'Unknown error during user deletion',
          cleanupErrors: cleanupErrors.length > 0 ? cleanupErrors : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Account deleted successfully',
        cleanupWarnings: cleanupErrors.length ? cleanupErrors : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[DELETE /api/account/delete] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

