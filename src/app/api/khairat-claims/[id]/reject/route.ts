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

// POST /api/claims/[id]/reject - Reject a claim
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      rejectedBy,
      rejectionReason,
      notes
    } = body;

    if (!rejectedBy || !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejector ID and rejection reason are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Verify rejector is an admin
    const { data: rejector, error: rejectorError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, role, full_name')
      .eq('id', rejectedBy)
      .single();

    if (rejectorError || !rejector) {
      return NextResponse.json(
        { error: 'Rejector not found' },
        { status: 404 }
      );
    }

    if (rejector.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can reject claims' },
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

    // Check if claim can be rejected
    if (!['pending', 'under_review'].includes(currentClaim.status)) {
      return NextResponse.json(
        { error: 'Claim cannot be rejected in current status' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update claim status to rejected
    const { data: updatedClaim, error: updateError } = await supabaseAdmin
      .from('khairat_claims')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        reviewed_by: rejectedBy,
        reviewed_at: now,
        notes: notes || null
      })
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
        ),
        reviewer:user_profiles!reviewed_by(
          id,
          full_name
        )
      `)
      .single();

    if (updateError) {
      console.error('Error rejecting claim:', updateError);
      return NextResponse.json(
        { error: 'Failed to reject claim' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedClaim,
      message: 'Claim rejected successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/claims/[id]/reject:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}