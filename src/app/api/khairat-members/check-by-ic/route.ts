import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Local helper to get Supabase admin client
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase admin environment variables');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const mosqueId = body.mosqueId as string | undefined;
    const ic = (body.ic as string | undefined)?.trim();

    if (!mosqueId || !ic) {
      return NextResponse.json(
        { error: 'Mosque ID and IC number are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Find khairat member by IC and mosque (no user_id filter)
    const { data: members, error: memberError } = await supabaseAdmin
      .from('khairat_members')
      .select(`
        id,
        mosque_id,
        ic_passport_number,
        status,
        membership_number,
        full_name,
        phone,
        email,
        created_at,
        updated_at
      `)
      .eq('mosque_id', mosqueId)
      .eq('ic_passport_number', ic)
      .order('created_at', { ascending: false });

    if (memberError) {
      console.error('Error querying khairat_members in /api/khairat-members/check-by-ic:', memberError);
      return NextResponse.json(
        { error: 'Failed to fetch khairat membership' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      members: members || [],
    });
  } catch (error) {
    console.error('Error in POST /api/khairat-members/check-by-ic:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

