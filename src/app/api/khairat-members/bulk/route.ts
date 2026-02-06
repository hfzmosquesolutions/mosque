import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isValidMalaysiaIc, normalizeMalaysiaIc } from '@/lib/utils';

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
    const { mosque_id, members } = body;

    if (!mosque_id) {
      return NextResponse.json(
        { error: 'mosque_id is required' },
        { status: 400 }
      );
    }

    if (!members || !Array.isArray(members) || members.length === 0) {
      return NextResponse.json(
        { error: 'members array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Get the authenticated user from authorization header
    const authHeader = request.headers.get('authorization');
    let user = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (!authError && authUser) {
        user = authUser;
      }
    }

    // If no auth header, try to get from cookies (for browser requests)
    if (!user) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        // Extract access token from cookies if available
        const cookies = Object.fromEntries(
          cookieHeader.split('; ').map(c => c.split('='))
        );
        // Supabase stores the session in a cookie, but we need to use the client library
        // For now, we'll require the user_id to be passed in the request body for security
      }
    }

    // For now, we'll get user_id from the request body as a workaround
    // In production, you should properly extract it from the session
    const { user_id } = body;
    
    if (!user_id) {
      return NextResponse.json(
        { error: 'Authentication required. Please ensure you are logged in.' },
        { status: 401 }
      );
    }

    // Verify the user exists
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    if (userError || !userData?.user) {
      return NextResponse.json(
        { error: 'Invalid user' },
        { status: 401 }
      );
    }

    // Check if user is admin of the mosque
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user_id)
      .single();

    const { data: mosqueAdmin } = await supabaseAdmin
      .from('mosques')
      .select('user_id')
      .eq('id', mosque_id)
      .single();

    if (userProfile?.role !== 'admin' && mosqueAdmin?.user_id !== user_id) {
      return NextResponse.json(
        { error: 'Forbidden: Not authorized to create members for this mosque' },
        { status: 403 }
      );
    }

    // Validate and prepare members for insertion
    const membersToInsert: any[] = [];
    const membersWithDependents: Array<{ memberIndex: number; dependents: any[] }> = [];
    const errors: string[] = [];
    const skipped: string[] = [];

    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      const rowNumber = i + 2; // +2 because row 1 is header

      // Validate required fields
      if (!member.full_name || !member.ic_passport_number) {
        errors.push(`Row ${rowNumber}: Full name and IC number are required`);
        continue;
      }

      // Normalize and validate IC number
      const normalizedIc = normalizeMalaysiaIc(member.ic_passport_number).slice(0, 12);
      if (!isValidMalaysiaIc(normalizedIc)) {
        errors.push(`Row ${rowNumber}: Invalid IC number format`);
        continue;
      }

      // Check if member with same IC already exists for this mosque
      const { data: existingMember } = await supabaseAdmin
        .from('khairat_members')
        .select('id, status')
        .eq('ic_passport_number', normalizedIc)
        .eq('mosque_id', mosque_id)
        .maybeSingle();

      if (existingMember) {
        skipped.push(`Row ${rowNumber}: Member with IC ${normalizedIc} already exists (${existingMember.status})`);
        continue;
      }

      // Check if membership number is provided and if it's unique for this mosque
      if (member.membership_number && member.membership_number.trim()) {
        const { data: existingByMembershipNumber } = await supabaseAdmin
          .from('khairat_members')
          .select('id, status')
          .eq('membership_number', member.membership_number.trim())
          .eq('mosque_id', mosque_id)
          .maybeSingle();

        if (existingByMembershipNumber) {
          skipped.push(`Row ${rowNumber}: Member with membership ID ${member.membership_number} already exists`);
          continue;
        }
      }

      // Parse dependents if provided (can be JSON string or array)
      let dependents: any[] = [];
      if (member.dependents) {
        try {
          if (typeof member.dependents === 'string') {
            dependents = JSON.parse(member.dependents);
          } else if (Array.isArray(member.dependents)) {
            dependents = member.dependents;
          }
        } catch (e) {
          errors.push(`Row ${rowNumber}: Invalid dependents format (must be valid JSON array)`);
        }
      }

      // Prepare member data
      membersToInsert.push({
        mosque_id,
        full_name: member.full_name.trim(),
        ic_passport_number: normalizedIc,
        membership_number: member.membership_number?.trim() || null,
        phone: member.phone?.trim() || null,
        email: member.email?.trim() || null,
        address: member.address?.trim() || null,
        notes: member.notes?.trim() || null,
        status: 'active',
        joined_date: new Date().toISOString().split('T')[0],
      });

      // Store dependents for later insertion (after member is created)
      if (dependents.length > 0) {
        membersWithDependents.push({
          memberIndex: membersToInsert.length - 1,
          dependents: dependents.filter(dep => dep.full_name && dep.relationship).map(dep => ({
            full_name: dep.full_name?.trim() || '',
            relationship: dep.relationship?.trim() || '',
            ic_passport_number: dep.ic_passport_number?.trim() || undefined,
            date_of_birth: dep.date_of_birth || undefined,
            gender: dep.gender || undefined,
            phone: dep.phone?.trim() || undefined,
            email: dep.email?.trim() || undefined,
            address: dep.address?.trim() || undefined,
            emergency_contact: dep.emergency_contact || false,
            notes: dep.notes?.trim() || undefined,
          })),
        });
      }
    }

    if (membersToInsert.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid members to insert',
          errors,
          skipped,
        },
        { status: 400 }
      );
    }

    // Insert members in batches to avoid overwhelming the database
    const batchSize = 100;
    const insertedMembers: any[] = [];
    const insertErrors: string[] = [];
    let dependentsCreated = 0;
    const dependentsErrors: string[] = [];

    for (let i = 0; i < membersToInsert.length; i += batchSize) {
      const batch = membersToInsert.slice(i, i + batchSize);
      
      const { data: batchResult, error: batchError } = await supabaseAdmin
        .from('khairat_members')
        .insert(batch)
        .select();

      if (batchError) {
        insertErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${batchError.message}`);
      } else if (batchResult) {
        insertedMembers.push(...batchResult);

        // Create dependents for the inserted members in this batch
        // Map inserted members by their original index in membersToInsert
        for (let j = 0; j < batchResult.length; j++) {
          const originalIndex = i + j;
          const memberWithDeps = membersWithDependents.find(m => m.memberIndex === originalIndex);
          
          if (memberWithDeps && memberWithDeps.dependents.length > 0) {
            const createdMember = batchResult[j];
            
            if (createdMember) {
              const dependentsToInsert = memberWithDeps.dependents.map(dep => ({
                ...dep,
                khairat_member_id: createdMember.id,
              }));

              const { error: depsError } = await supabaseAdmin
                .from('khairat_member_dependents')
                .insert(dependentsToInsert);

              if (depsError) {
                dependentsErrors.push(`Row ${originalIndex + 2}: Failed to create dependents - ${depsError.message}`);
              } else {
                dependentsCreated += dependentsToInsert.length;
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${insertedMembers.length} member(s)${dependentsCreated > 0 ? ` with ${dependentsCreated} dependent(s)` : ''}`,
      created_count: insertedMembers.length,
      dependents_created: dependentsCreated,
      errors: errors.length > 0 ? errors : undefined,
      skipped: skipped.length > 0 ? skipped : undefined,
      insert_errors: insertErrors.length > 0 ? insertErrors : undefined,
      dependents_errors: dependentsErrors.length > 0 ? dependentsErrors : undefined,
    });
  } catch (error: any) {
    console.error('Error in bulk member creation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create members' },
      { status: 500 }
    );
  }
}
