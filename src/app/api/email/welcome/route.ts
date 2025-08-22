import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userEmail, userName, mosqueName } = body;

    // Validate required fields
    if (!userId || !userEmail || !userName) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, userEmail, userName' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user exists in database
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get mosque information if mosqueName is not provided
    let finalMosqueName = mosqueName;
    if (!finalMosqueName) {
      const { data: mosque } = await supabase
        .from('mosques')
        .select('name')
        .eq('user_id', userId)
        .single();
      
      finalMosqueName = mosque?.name || 'Our Mosque Community';
    }

    // Send welcome email
    const result = await emailService.sendWelcomeEmail({
      to: userEmail,
      userName: userName,
      mosqueName: finalMosqueName,
    });

    // Log the email sending activity
    const { error: logError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'Welcome Email Sent',
        message: `Welcome email sent to ${userEmail}`,
        type: 'email',
        metadata: {
          email_type: 'welcome',
          email_id: result.data?.id,
          mosque_name: finalMosqueName,
        },
      });

    if (logError) {
      console.error('Failed to log email activity:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent successfully',
      emailId: result.data?.id,
    });

  } catch (error) {
    console.error('Error sending welcome email:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to send welcome email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check if welcome email was already sent
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Check if welcome email notification exists
    const { data: notification, error } = await supabase
      .from('notifications')
      .select('id, created_at, metadata')
      .eq('user_id', userId)
      .eq('type', 'email')
      .contains('metadata', { email_type: 'welcome' })
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({
      welcomeEmailSent: !!notification,
      lastSent: notification?.created_at || null,
      emailId: notification?.metadata?.email_id || null,
    });

  } catch (error) {
    console.error('Error checking welcome email status:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to check welcome email status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}