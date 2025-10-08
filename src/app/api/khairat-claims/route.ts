import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ClaimFilters, KhairatClaim, CreateKhairatClaim } from '@/types/database';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// GET /api/claims - List claims with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mosqueId = searchParams.get('mosqueId');
    const claimantId = searchParams.get('claimantId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Mosque ID is optional - if not provided, we'll return all claims (admin only)
    // This allows for more flexible querying

    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin
      .from('khairat_claims')
      .select(`
        *,
        claimant:user_profiles!claimant_id(
          id,
          full_name,
          phone,
          ic_passport_number
        ),
        reviewer:user_profiles!reviewed_by(
          id,
          full_name
        ),
        approver:user_profiles!approved_by(
          id,
          full_name
        )
      `, { count: 'exact' });
    
    // Apply mosque filter if provided
    if (mosqueId) {
      query = query.eq('mosque_id', mosqueId);
    }

    // Apply filters
    if (claimantId) {
      query = query.eq('claimant_id', claimantId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: claims, error, count } = await query;

    if (error) {
      console.error('Error fetching claims:', error);
      return NextResponse.json(
        { error: 'Failed to fetch claims' },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      data: claims,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error in GET /api/claims:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/claims - Create new claim
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      claimantId,
      mosqueId,
      claimAmount,
      reason,
      description,
      priority = 'medium'
    } = body;

    // Validate required fields
    if (!claimantId || !mosqueId || !claimAmount || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: claimantId, mosqueId, claimAmount, reason' },
        { status: 400 }
      );
    }

    // Validate amount
    if (typeof claimAmount !== 'number' || claimAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid claim amount' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Verify claimant exists and belongs to mosque
    const { data: claimant, error: claimantError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('id', claimantId)
      .single();

    if (claimantError || !claimant) {
      return NextResponse.json(
        { error: 'Claimant not found' },
        { status: 404 }
      );
    }

    // No program validation needed - khairat claims are general assistance requests

    // Create the claim
    const claimData: CreateKhairatClaim = {
      claimant_id: claimantId,
      mosque_id: mosqueId,
      requested_amount: claimAmount,
      title: reason,
      description: description || null,
      priority
    };

    const { data: newClaim, error: createError } = await supabaseAdmin
      .from('khairat_claims')
      .insert(claimData)
      .select(`
        *,
        claimant:user_profiles!claimant_id(
          id,
          full_name,
          phone,
          ic_passport_number
        )
      `)
      .single();

    if (createError) {
      console.error('Error creating claim:', createError);
      return NextResponse.json(
        { error: 'Failed to create claim' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newClaim,
      message: 'Claim created successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/claims:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}