import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const { legacy_record_id, user_id, mosque_id } = await request.json();

    if (!legacy_record_id || typeof legacy_record_id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid legacy_record_id provided' },
        { status: 400 }
      );
    }

    if (!user_id || !mosque_id) {
      return NextResponse.json(
        { success: false, error: 'user_id and mosque_id are required' },
        { status: 400 }
      );
    }

    // First, get the legacy record to extract contribution data
    const { data: legacyRecord, error: fetchError } = await supabaseAdmin
      .from('legacy_khairat_records')
      .select('*')
      .eq('id', legacy_record_id)
      .single();

    if (fetchError) {
      console.error('Error fetching legacy record:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch legacy record' },
        { status: 500 }
      );
    }

    if (!legacyRecord) {
      return NextResponse.json(
        { success: false, error: 'Legacy record not found' },
        { status: 404 }
      );
    }

    // Create contribution record for the legacy record
    const contributionData = {
      mosque_id: mosque_id,
      contributor_id: user_id,
      contributor_name: legacyRecord.full_name,
      amount: legacyRecord.amount,
      contributed_at: legacyRecord.payment_date,
      status: 'completed',
      payment_method: 'legacy_record',
      payment_reference: legacyRecord.invoice_number,
      notes: `Matched from legacy record: ${legacyRecord.full_name}`
    };

    const { data: contribution, error: contributionError } = await supabaseAdmin
      .from('khairat_contributions')
      .insert(contributionData)
      .select()
      .single();

    if (contributionError) {
      console.error('Error creating contribution:', contributionError);
      return NextResponse.json(
        { success: false, error: 'Failed to create contribution' },
        { status: 500 }
      );
    }

    // Update the legacy record with the contribution ID
    const { data: updatedRecord, error: updateError } = await supabaseAdmin
      .from('legacy_khairat_records')
      .update({
        matched_user_id: user_id,
        is_matched: true,
        contribution_id: contribution.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', legacy_record_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating legacy record:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update legacy record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        matchedRecord: updatedRecord,
        createdContribution: contribution
      }
    });
  } catch (error) {
    console.error('Error in match legacy records API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}