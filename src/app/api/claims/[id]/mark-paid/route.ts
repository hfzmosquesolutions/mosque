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

// POST /api/claims/[id]/mark-paid - Mark a claim as paid
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      markedBy,
      notes
    } = body;

    if (!markedBy) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Verify user is an admin
    const { data: user, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, role, full_name')
      .eq('id', markedBy)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can mark claims as paid' },
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

    // Check if claim can be marked as paid (must be approved first)
    if (currentClaim.status !== 'approved') {
      return NextResponse.json(
        { error: 'Only approved claims can be marked as paid' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update claim status to paid
    const { data: updatedClaim, error: updateError } = await supabaseAdmin
      .from('khairat_claims')
      .update({
        status: 'paid',
        paid_at: now,
        notes: notes ? `${currentClaim.notes || ''}\n\nMarked as paid: ${notes}` : currentClaim.notes
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
      console.error('Error marking claim as paid:', updateError);
      return NextResponse.json(
        { error: 'Failed to mark claim as paid' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedClaim,
      message: 'Claim marked as paid successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/claims/[id]/mark-paid:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}