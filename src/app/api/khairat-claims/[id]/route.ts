import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UpdateKhairatClaim } from '@/types/database';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// GET /api/claims/[id] - Get single claim with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeDocuments = searchParams.get('includeDocuments') === 'true';

    const supabaseAdmin = getSupabaseAdmin();
    
    let selectQuery = `
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
      mosque:mosques(
        id,
        name
      ),
      program:contribution_programs(
        id,
        name,
        description
      ),
      reviewer:user_profiles!reviewed_by(
        id,
        full_name
      ),
      approver:user_profiles!approved_by(
        id,
        full_name
      )
    `;

    if (includeDocuments) {
      selectQuery += `,
      documents:khairat_claim_documents(
        id,
        file_name,
        file_url,
        file_type,
        file_size,
        created_at
      )`;
    }


    const { data: claim, error } = await supabaseAdmin
      .from('khairat_claims')
      .select(selectQuery)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching claim:', error);
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: claim
    });

  } catch (error) {
    console.error('Error in GET /api/claims/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/claims/[id] - Update claim
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      claimAmount,
      reason,
      description,
      priority,
      notes,
      userId // ID of user making the update
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get current claim to check permissions and status
    const { data: currentClaim, error: fetchError } = await supabaseAdmin
      .from('khairat_claims')
      .select('id, khairat_member_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !currentClaim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      );
    }

    // Only allow updates if claim is pending or under_review
    if (!['pending', 'under_review'].includes(currentClaim.status)) {
      return NextResponse.json(
        { error: 'Cannot update claim in current status' },
        { status: 400 }
      );
    }

    // Check if user is the member (via khairat_member_id) or an admin
    let isMember = false;
    
    if (currentClaim.khairat_member_id) {
      const { data: khairatMember } = await supabaseAdmin
        .from('khairat_members')
        .select('user_id')
        .eq('id', currentClaim.khairat_member_id)
        .single();
      
      isMember = khairatMember?.user_id === userId;
    }
    
    // Get user role to check if admin
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();

    const isAdmin = userProfile?.role === 'admin';

    if (!isMember && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized to update this claim' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: UpdateKhairatClaim = {};
    
    if (claimAmount !== undefined) {
      if (typeof claimAmount !== 'number' || claimAmount <= 0) {
        return NextResponse.json(
          { error: 'Invalid claim amount' },
          { status: 400 }
        );
      }
      updateData.requested_amount = claimAmount;
    }
    
    if (reason !== undefined) updateData.title = reason;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (notes !== undefined) updateData.admin_notes = notes;

    // Update the claim
    const { data: updatedClaim, error: updateError } = await supabaseAdmin
      .from('khairat_claims')
      .update(updateData)
      .eq('id', id)
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
        program:contribution_programs(
          id,
          name,
          description
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating claim:', updateError);
      return NextResponse.json(
        { error: 'Failed to update claim' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedClaim,
      message: 'Claim updated successfully'
    });

  } catch (error) {
    console.error('Error in PUT /api/claims/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/claims/[id] - Cancel/Delete claim
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get current claim to check permissions and status
    const { data: currentClaim, error: fetchError } = await supabaseAdmin
      .from('khairat_claims')
      .select('id, khairat_member_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !currentClaim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      );
    }

    // Only allow cancellation if claim is pending or under_review
    if (!['pending', 'under_review'].includes(currentClaim.status)) {
      return NextResponse.json(
        { error: 'Cannot cancel claim in current status' },
        { status: 400 }
      );
    }

    // Check if user is the member (via khairat_member_id) or an admin
    let isMember = false;
    
    if (currentClaim.khairat_member_id) {
      const { data: khairatMember } = await supabaseAdmin
        .from('khairat_members')
        .select('user_id')
        .eq('id', currentClaim.khairat_member_id)
        .single();
      
      isMember = khairatMember?.user_id === userId;
    }
    
    // Get user role to check if admin
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();

    const isAdmin = userProfile?.role === 'admin';

    if (!isMember && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized to cancel this claim' },
        { status: 403 }
      );
    }

    // Update claim status to cancelled
    const { error: updateError } = await supabaseAdmin
      .from('khairat_claims')
      .update({ 
        status: 'cancelled',
        admin_notes: `Cancelled by ${isMember ? 'member' : 'admin'} on ${new Date().toISOString()}`
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error cancelling claim:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel claim' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Claim cancelled successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/claims/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}