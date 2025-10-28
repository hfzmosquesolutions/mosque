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
    const { legacy_record_ids } = await request.json();

    // Validate input
    if (!legacy_record_ids || !Array.isArray(legacy_record_ids) || legacy_record_ids.length === 0) {
      return NextResponse.json(
        { error: 'legacy_record_ids array is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Validate all IDs are strings
    if (!legacy_record_ids.every(id => typeof id === 'string')) {
      return NextResponse.json(
        { error: 'All legacy_record_ids must be strings' },
        { status: 400 }
      );
    }

    // Fetch all legacy records with their contribution IDs
    const { data: legacyRecords, error: fetchError } = await supabaseAdmin
      .from('legacy_khairat_records')
      .select('id, contribution_id')
      .in('id', legacy_record_ids);

    if (fetchError) {
      console.error('Error fetching legacy records:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch legacy records' },
        { status: 500 }
      );
    }

    if (!legacyRecords || legacyRecords.length === 0) {
      return NextResponse.json(
        { error: 'No legacy records found with the provided IDs' },
        { status: 404 }
      );
    }

    // Check if some records were not found
    const foundIds = legacyRecords.map(record => record.id);
    const notFoundIds = legacy_record_ids.filter(id => !foundIds.includes(id));
    
    if (notFoundIds.length > 0) {
      return NextResponse.json(
        { 
          error: `Some legacy records not found: ${notFoundIds.join(', ')}`,
          not_found_ids: notFoundIds
        },
        { status: 404 }
      );
    }

    // Get contribution IDs that need to be deleted
    const contributionIds = legacyRecords
      .filter(record => record.contribution_id)
      .map(record => record.contribution_id);

    let deletedContributions = 0;

    // Delete contributions if they exist
    if (contributionIds.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from('khairat_contributions')
        .delete()
        .in('id', contributionIds);

      if (deleteError) {
        console.error('Error deleting contributions:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete contributions' },
          { status: 500 }
        );
      }
      deletedContributions = contributionIds.length;
    }

    // Update all legacy records to unmatch them
    const { error: updateError } = await supabaseAdmin
      .from('legacy_khairat_records')
      .update({
        matched_user_id: null,
        contribution_id: null,
        is_matched: false
      })
      .in('id', legacy_record_ids);

    if (updateError) {
      console.error('Error updating legacy records:', updateError);
      return NextResponse.json(
        { error: 'Failed to update legacy records' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Successfully unmatched ${legacy_record_ids.length} legacy records`,
      unmatched_records: legacy_record_ids.length,
      deleted_contributions: deletedContributions
    });
  } catch (error) {
    console.error('Error in bulk unmatch API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}