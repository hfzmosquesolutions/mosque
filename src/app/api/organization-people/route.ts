import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isUserMosqueAdmin } from '@/lib/api';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mosqueId = searchParams.get('mosque_id');
    const isPublic = searchParams.get('public') === 'true';

    if (!mosqueId) {
      return NextResponse.json(
        { error: 'Mosque ID is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin
      .from('organization_people')
      .select('*')
      .eq('mosque_id', mosqueId)
      .eq('is_active', true)
      .order('position', { ascending: true });

    // If requesting public data, only return public records
    if (isPublic) {
      query = query.eq('is_public', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching organization people:', error);
      return NextResponse.json(
        { error: 'Failed to fetch organization people' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in GET /api/organization-people:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mosque_id, full_name, position, department, email, phone, address, bio, profile_picture_url, is_public, start_date, end_date } = body;

    // Get the current user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Check if user is admin of the mosque
    const isAdmin = await isUserMosqueAdmin(user.id, mosque_id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only mosque admins can add organization people' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!full_name || !position) {
      return NextResponse.json(
        { error: 'Full name and position are required' },
        { status: 400 }
      );
    }

    // Prepare data with proper null handling for dates
    const insertData: any = {
      mosque_id,
      full_name,
      position,
      department: department || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      bio: bio || null,
      profile_picture_url: profile_picture_url || null,
      is_public: is_public ?? true,
      created_by: user.id
    };

    // Only include date fields if they have valid values
    if (start_date && start_date.trim() !== '') {
      insertData.start_date = start_date;
    }
    if (end_date && end_date.trim() !== '') {
      insertData.end_date = end_date;
    }

    const { data, error } = await supabaseAdmin
      .from('organization_people')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating organization person:', error);
      return NextResponse.json(
        { error: 'Failed to create organization person' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/organization-people:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
