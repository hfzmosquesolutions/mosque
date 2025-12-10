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
        khairat_member:khairat_members!khairat_member_id(
          id,
          full_name,
          phone,
          ic_passport_number,
          email,
          address,
          membership_number,
          status
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
      khairatMemberId,
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

    // Find the khairat_member record for this user and mosque
    // This links the claim to the membership record
    let resolvedKhairatMemberId: string | null = khairatMemberId || null;
    
    // If khairatMemberId not provided, try to find it
    if (!resolvedKhairatMemberId && claimantId) {
      const { data: khairatMembers, error: memberError } = await supabaseAdmin
        .from('khairat_members')
        .select('id, status')
        .eq('user_id', claimantId)
        .eq('mosque_id', mosqueId)
        .in('status', ['active', 'approved'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (!memberError && khairatMembers && khairatMembers.length > 0) {
        resolvedKhairatMemberId = khairatMembers[0].id;
      }
    }

    // Verify that user is an active or approved member of the mosque
    if (!resolvedKhairatMemberId) {
      // Check if user has any membership record (even if not active)
      const { data: anyMembers, error: anyMemberError } = await supabaseAdmin
        .from('khairat_members')
        .select('id, status')
        .eq('user_id', claimantId)
        .eq('mosque_id', mosqueId)
        .limit(1);

      if (!anyMemberError && anyMembers && anyMembers.length > 0) {
        return NextResponse.json(
          { error: 'You must be an active or approved member of this mosque to submit a claim' },
          { status: 403 }
        );
      } else {
        return NextResponse.json(
          { error: 'You must be a member of this mosque to submit a claim. Please apply for membership first.' },
          { status: 403 }
        );
      }
    }

    // Verify claimant exists (for backward compatibility)
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

    // Create the claim - prefer khairat_member_id if available
    const claimData: CreateKhairatClaim = {
      khairat_member_id: resolvedKhairatMemberId || undefined,
      claimant_id: claimantId, // Keep for backward compatibility
      mosque_id: mosqueId,
      requested_amount: claimAmount,
      title: reason,
      description: description || '', // description is NOT NULL, so use empty string if not provided
      priority
    };

    const { data: newClaim, error: createError } = await supabaseAdmin
      .from('khairat_claims')
      .insert(claimData)
      .select(`
        *,
        khairat_member:khairat_members!khairat_member_id(
          id,
          full_name,
          phone,
          ic_passport_number,
          email,
          address,
          membership_number,
          status
        )
      `)
      .single();

    if (createError) {
      console.error('Error creating claim:', createError);
      console.error('Claim data attempted:', claimData);
      return NextResponse.json(
        { error: `Failed to create claim: ${createError.message || 'Unknown error'}` },
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