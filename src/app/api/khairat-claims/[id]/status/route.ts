import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ClaimStatus } from '@/types/database';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// PUT /api/claims/[id]/status - Update claim status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      status,
      updatedBy,
      notes
    } = body;

    if (!status || !updatedBy) {
      return NextResponse.json(
        { error: 'Status and updater ID are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses: ClaimStatus[] = ['pending', 'under_review', 'approved', 'rejected', 'paid', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Verify user is an admin
    const { data: user, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, role, full_name')
      .eq('id', updatedBy)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can update claim status' },
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

    // Validate status transitions
    const currentStatus = currentClaim.status;
    const validTransitions: Record<ClaimStatus, ClaimStatus[]> = {
      'pending': ['under_review', 'approved', 'rejected', 'cancelled'],
      'under_review': ['approved', 'rejected', 'cancelled', 'pending'],
      'approved': ['paid', 'cancelled'],
      'rejected': ['under_review', 'pending'], // Allow re-review
      'paid': [], // Final status
      'cancelled': [] // Final status
    };

    if (!validTransitions[currentStatus as ClaimStatus].includes(status)) {
      return NextResponse.json(
        { error: `Cannot change status from ${currentStatus} to ${status}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const updateData: any = {
      status,
      notes: notes || currentClaim.notes
    };

    // Set appropriate timestamps based on status
    if (status === 'under_review' && currentStatus === 'pending') {
      updateData.reviewed_by = updatedBy;
      updateData.reviewed_at = now;
    }

    // Update claim status
    const { data: updatedClaim, error: updateError } = await supabaseAdmin
      .from('khairat_claims')
      .update(updateData)
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
        reviewer:user_profiles!reviewed_by(
          id,
          full_name
        ),
        approver:user_profiles!approved_by(
          id,
          full_name
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating claim status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update claim status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedClaim,
      message: `Claim status updated to ${status} successfully`
    });

  } catch (error) {
    console.error('Error in PUT /api/claims/[id]/status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}