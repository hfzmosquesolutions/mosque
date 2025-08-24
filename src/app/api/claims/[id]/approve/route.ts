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

// POST /api/claims/[id]/approve - Approve a claim
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      approvedBy,
      approvedAmount,
      notes
    } = body;

    if (!approvedBy) {
      return NextResponse.json(
        { error: 'Approver ID is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Verify approver is an admin
    const { data: approver, error: approverError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, role, full_name')
      .eq('id', approvedBy)
      .single();

    if (approverError || !approver) {
      return NextResponse.json(
        { error: 'Approver not found' },
        { status: 404 }
      );
    }

    if (approver.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can approve claims' },
        { status: 403 }
      );
    }

    // Get current claim
    const { data: currentClaim, error: fetchError } = await supabaseAdmin
      .from('khairat_claims')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentClaim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      );
    }

    // Check if claim can be approved
    if (!['pending', 'under_review'].includes(currentClaim.status)) {
      return NextResponse.json(
        { error: 'Claim cannot be approved in current status' },
        { status: 400 }
      );
    }

    // Validate approved amount
    const finalApprovedAmount = approvedAmount || currentClaim.requested_amount;
    if (typeof finalApprovedAmount !== 'number' || finalApprovedAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid approved amount' },
        { status: 400 }
      );
    }

    if (finalApprovedAmount > currentClaim.requested_amount) {
      return NextResponse.json(
        { error: 'Approved amount cannot exceed claimed amount' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update claim status to approved
    const { data: updatedClaim, error: updateError } = await supabaseAdmin
      .from('khairat_claims')
      .update({
        status: 'approved',
        approved_amount: finalApprovedAmount,
        approved_by: approvedBy,
        approved_at: now,
        reviewed_by: approvedBy,
        reviewed_at: now,
        notes: notes || null
      })
      .eq('id', id)
      .select(`
        *,
        claimant:user_profiles!claimant_id(
          id,
          full_name,
          phone,
          ic_passport_number
        ),
        program:contribution_programs(
          id,
          name,
          description
        ),
        approver:user_profiles!approved_by(
          id,
          full_name
        )
      `)
      .single();

    if (updateError) {
      console.error('Error approving claim:', updateError);
      return NextResponse.json(
        { error: 'Failed to approve claim' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedClaim,
      message: 'Claim approved successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/claims/[id]/approve:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}