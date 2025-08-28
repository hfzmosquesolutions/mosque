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

export async function POST(request: Request) {
  try {
    const { legacy_record_id } = await request.json();

    if (!legacy_record_id || typeof legacy_record_id !== 'string') {
      return NextResponse.json(
        { error: 'legacy_record_id is required' },
        { status: 400 }
      );
    }

    // Get the contribution ID associated with this legacy record
    const { data: legacyRecord, error: fetchError } = await supabaseAdmin
      .from('legacy_khairat_records')
      .select('id, contribution_id')
      .eq('id', legacy_record_id)
      .single();

    if (fetchError) {
      console.error('Error fetching legacy record:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch legacy record' },
        { status: 500 }
      );
    }

    // Delete the contribution if it exists
    let deletedContribution = false;
    if (legacyRecord?.contribution_id) {
      const { error: deleteError } = await supabaseAdmin
        .from('contributions')
        .delete()
        .eq('id', legacyRecord.contribution_id);

      if (deleteError) {
        console.error('Error deleting contribution:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete contribution' },
          { status: 500 }
        );
      }
      deletedContribution = true;
    }

    // Update the legacy record to unmatch it
    const { error: updateError } = await supabaseAdmin
      .from('legacy_khairat_records')
      .update({
        matched_user_id: null,
        contribution_id: null,
        is_matched: false
      })
      .eq('id', legacy_record_id);

    if (updateError) {
      console.error('Error updating legacy record:', updateError);
      return NextResponse.json(
        { error: 'Failed to update legacy record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Legacy record unmatched successfully',
      deleted_contribution: deletedContribution
    });
  } catch (error) {
    console.error('Error in unmatch API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}