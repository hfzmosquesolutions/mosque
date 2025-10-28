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

    const body = await request.json();
    const { legacy_record_ids, user_id, program_id } = body;

    if (!legacy_record_ids || !Array.isArray(legacy_record_ids) || legacy_record_ids.length === 0) {
      return NextResponse.json(
        { error: 'legacy_record_ids array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    if (!program_id) {
      return NextResponse.json(
        { error: 'program_id is required' },
        { status: 400 }
      );
    }

    // Verify all legacy records exist and are unmatched
    const { data: legacyRecords, error: fetchError } = await supabaseAdmin
      .from('legacy_khairat_records')
      .select('id, amount, is_matched, mosque_id, full_name, payment_date, invoice_number')
      .in('id', legacy_record_ids);

    if (fetchError) {
      console.error('Error fetching legacy records:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch legacy records' },
        { status: 500 }
      );
    }

    if (!legacyRecords || legacyRecords.length !== legacy_record_ids.length) {
      return NextResponse.json(
        { error: 'Some legacy records not found' },
        { status: 404 }
      );
    }

    // Check if any records are already matched
    const alreadyMatched = legacyRecords.filter((record: any) => record.is_matched);
    if (alreadyMatched.length > 0) {
      return NextResponse.json(
        { error: `${alreadyMatched.length} record(s) are already matched` },
        { status: 400 }
      );
    }

    // Start transaction - create contributions and update legacy records
    const contributionInserts = legacyRecords.map((record: any) => ({
      program_id: program_id,
      contributor_id: user_id,
      contributor_name: record.full_name,
      amount: record.amount,
      contributed_at: record.payment_date,
      status: 'completed',
      payment_method: 'legacy_record',
      payment_reference: record.invoice_number,
      notes: `Bulk matched from legacy record: ${record.full_name}`
    }));

    // Insert all contributions
    const { data: contributions, error: contributionError } = await supabaseAdmin
      .from('khairat_contributions')
      .insert(contributionInserts)
      .select('id');

    if (contributionError) {
      console.error('Error creating contributions:', contributionError);
      return NextResponse.json(
        { error: 'Failed to create contributions' },
        { status: 500 }
      );
    }
console.log('contributions',contributions)
    if (!contributions || contributions.length !== legacy_record_ids.length) {
      return NextResponse.json(
        { error: 'Failed to create all contributions' },
        { status: 500 }
      );
    }

    // Update legacy records with contribution IDs
    const updatePromises = legacy_record_ids.map(async (recordId, index) => {
      const { error } = await supabaseAdmin
        .from('legacy_khairat_records')
        .update({
          matched_user_id: user_id,
          is_matched: true,
          contribution_id: contributions[index].id,
        })
        .eq('id', recordId);
      
      if (error) {
        throw error;
      }
    });

    // Execute all updates
    try {
      await Promise.all(updatePromises);
    } catch (updateError) {
      console.error('Error updating legacy records:', updateError);
      // Try to rollback contributions if legacy record update fails
      await supabaseAdmin
        .from('khairat_contributions')
        .delete()
        .in('id', contributions.map((c: any) => c.id));
      
      return NextResponse.json(
        { error: 'Failed to update legacy records' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Bulk match completed successfully',
      matched_count: legacy_record_ids.length,
      contribution_ids: contributions.map((c: any) => c.id),
    });
  } catch (error) {
    console.error('Bulk match error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}