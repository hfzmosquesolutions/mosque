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

    // Best-effort cleanup of user-related data.
    // We intentionally keep contribution/payment history for mosque records,
    // as documented in the profile docs.
    const cleanupErrors: string[] = [];

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

    // Delete user profile
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('[DELETE /api/account/delete] Error deleting profile:', profileError);
      cleanupErrors.push('profile');
    }

    // Finally, delete the auth user (revokes all access)
    const { error: deleteUserError } =
      await (supabaseAdmin as any).auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error('[DELETE /api/account/delete] Error deleting auth user:', deleteUserError);
      return NextResponse.json(
        { error: 'Failed to delete account' },
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

