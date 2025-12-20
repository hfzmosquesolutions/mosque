import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Local helper copied from other API routes (e.g. payments, khairat-claims)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase admin environment variables');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const mosqueId = body.mosqueId as string | undefined;
    const ic = (body.ic as string | undefined)?.trim();

    if (!mosqueId || !ic) {
      return NextResponse.json(
        { error: 'Mosque ID and IC number are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Find khairat member by IC and mosque (latest record)
    const { data: members, error: memberError } = await supabaseAdmin
      .from('khairat_members')
      .select('id, status, membership_number, created_at')
      .eq('mosque_id', mosqueId)
      .eq('ic_passport_number', ic)
      .order('created_at', { ascending: false });

    if (memberError) {
      console.error('Error querying khairat_members in /api/khairat-status:', memberError);
      return NextResponse.json(
        { error: 'Failed to fetch khairat registration' },
        { status: 500 }
      );
    }

    const latestMember = members && members.length > 0 ? members[0] : null;

    // 2. If we have a member, fetch related claims (only minimal fields)
    let claims: Array<{
      id: string;
      claimId?: string | null;
      status: string;
      createdAt: string;
    }> = [];

    if (latestMember) {
      const { data: claimsData, error: claimsError } = await supabaseAdmin
        .from('khairat_claims')
        .select('id, claim_id, status, created_at')
        .eq('mosque_id', mosqueId)
        .eq('khairat_member_id', latestMember.id)
        .order('created_at', { ascending: false });

      if (claimsError) {
        console.error('Error querying khairat_claims in /api/khairat-status:', claimsError);
      } else if (claimsData) {
        claims = claimsData.map((c) => ({
          id: c.id,
          claimId: (c as any).claim_id ?? null,
          status: c.status,
          createdAt: c.created_at,
        }));
      }
    }

    return NextResponse.json({
      success: true,
      registration: latestMember
        ? {
            found: true,
            memberId: latestMember.id,
            membershipNumber: latestMember.membership_number ?? null,
            status: latestMember.status,
          }
        : {
            found: false,
          },
      // SECURITY: Only expose claim ID/reference, status, and created date.
      // No personal info or claim details are returned here.
      claims,
    });
  } catch (error) {
    console.error('Error in POST /api/khairat-status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}







