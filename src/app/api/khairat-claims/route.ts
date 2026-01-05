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
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const supabaseAdmin = getSupabaseAdmin();
    
    // Since we have khairat_member_id, we don't need to filter by claimant_id
    // Use a single query that fetches all claims (with and without claimant_id)
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Build a single query for all claims
    // Note: Using ! for foreign keys does INNER JOIN, so claims with invalid khairat_member_id won't appear
    // This is correct since khairat_member_id is required
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
        mosque:mosques!khairat_claims_mosque_id_fkey(
          id,
          name
        ),
        claimant:user_profiles!khairat_claims_claimant_id_fkey(
          id,
          full_name
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
    
    // Apply filters
    if (mosqueId) {
      query = query.eq('mosque_id', mosqueId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (priority) {
      query = query.eq('priority', priority);
    }
    
    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    
    // Fetch all results (we'll paginate after)
    const result = await query.range(from, to);
    
    const { data: claims, error, count } = result;
    
    if (error) {
      console.error('Error fetching claims:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { 
          error: 'Failed to fetch claims',
          details: error.message || error
        },
        { status: 500 }
      );
    }
    
    // Format claims - ensure claimant is null for claims without claimant_id
    const formattedClaims = (claims || []).map(claim => ({
      ...claim,
      claimant: claim.claimant_id ? claim.claimant : null
    }));

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      data: formattedClaims,
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
      priority = 'medium',
      personInChargeName,
      personInChargePhone,
      personInChargeRelationship
    } = body;

    // Validate required fields
    if (!mosqueId || !claimAmount || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: mosqueId, claimAmount, reason' },
        { status: 400 }
      );
    }
    
    // khairatMemberId is now required (similar to payments)
    if (!khairatMemberId) {
      return NextResponse.json(
        { error: 'khairatMemberId is required. Please verify membership by IC number first.' },
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

    // Validate khairat_member_id (required) - similar to payments
    const { data: member, error: memberError } = await supabaseAdmin
      .from('khairat_members')
      .select('id, status, mosque_id')
      .eq('id', khairatMemberId)
      .eq('mosque_id', mosqueId)
      .in('status', ['active', 'approved'])
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Invalid or inactive khairat membership. Please verify membership by IC number first.' },
        { status: 400 }
      );
    }

    const resolvedKhairatMemberId = member.id;

    // Verify claimant exists (only if claimantId is provided - optional)
    if (claimantId) {
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
    }

    // Create the claim - khairat_member_id is required
    const claimData: CreateKhairatClaim = {
      khairat_member_id: resolvedKhairatMemberId, // Required
      claimant_id: claimantId || undefined, // Optional, for reference
      mosque_id: mosqueId,
      requested_amount: claimAmount,
      title: reason,
      description: description || '', // description is NOT NULL, so use empty string if not provided
      priority,
      person_in_charge_name: personInChargeName || undefined,
      person_in_charge_phone: personInChargePhone || undefined,
      person_in_charge_relationship: personInChargeRelationship || undefined
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
