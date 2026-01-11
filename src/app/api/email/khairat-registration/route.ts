import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';
import { createClient } from '@/lib/supabase';

const supabaseAdmin = createClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      mosqueId, 
      applicantName, 
      applicantIC, 
      applicantPhone, 
      applicantEmail, 
      applicantAddress, 
      applicationReason,
      memberId 
    } = body;

    // Validate required fields
    if (!mosqueId || !applicantName || !applicantIC) {
      return NextResponse.json(
        { error: 'Missing required fields: mosqueId, applicantName, applicantIC' },
        { status: 400 }
      );
    }

    // Get mosque information including admin user_id
    const { data: mosque, error: mosqueError } = await supabaseAdmin
      .from('mosques')
      .select('id, name, user_id')
      .eq('id', mosqueId)
      .single();

    if (mosqueError || !mosque) {
      return NextResponse.json(
        { error: 'Mosque not found' },
        { status: 404 }
      );
    }

    if (!mosque.user_id) {
      return NextResponse.json(
        { error: 'Mosque admin not found' },
        { status: 404 }
      );
    }

    // Get admin user's email from auth.users (requires admin client)
    const { data: adminUser, error: adminError } = await supabaseAdmin.auth.admin.getUserById(mosque.user_id);

    if (adminError || !adminUser?.user?.email) {
      console.error('Failed to get admin email:', adminError);
      return NextResponse.json(
        { error: 'Failed to get mosque admin email' },
        { status: 500 }
      );
    }

    // Get admin's name from user_profiles
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('full_name')
      .eq('id', mosque.user_id)
      .single();

    const adminName = adminProfile?.full_name || adminUser.user.email.split('@')[0] || 'Mosque Administrator';

    // Build review URL - redirect to members page where admin can check status
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const reviewUrl = `${appUrl}/ms/members`;

    // Send email notification
    const result = await emailService.sendKhairatRegistrationEmail({
      to: adminUser.user.email,
      adminName,
      mosqueName: mosque.name,
      applicantName,
      applicantIC,
      applicantPhone,
      applicantEmail,
      applicantAddress,
      applicationReason,
      reviewUrl,
    });

    return NextResponse.json({
      success: true,
      message: 'Khairat registration email sent successfully',
      emailId: result.data?.id,
    });

  } catch (error) {
    console.error('Error sending khairat registration email:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to send khairat registration email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}





