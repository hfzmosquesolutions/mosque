import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/payments/payment-service';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contributionId,
      mosqueId,
      amount,
      payerName,
      payerEmail,
      payerMobile,
      description,
      providerType = 'billplz'
    } = body;

    // Validate required fields
    if (!contributionId || !mosqueId || !amount || !payerName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Check if contribution exists and is pending
    const supabaseAdmin = getSupabaseAdmin();
    const { data: contribution, error: contributionError } = await supabaseAdmin
      .from('khairat_contributions')
      .select('id, status, mosque_id')
      .eq('id', contributionId)
      .eq('mosque_id', mosqueId)
      .single();

    if (contributionError || !contribution) {
      return NextResponse.json(
        { error: 'Contribution not found' },
        { status: 404 }
      );
    }

    if (contribution.status !== 'pending') {
      return NextResponse.json(
        { error: 'Contribution is not in pending status' },
        { status: 400 }
      );
    }

    // Check if mosque has payment provider configured
    const hasProvider = await PaymentService.hasPaymentProvider(mosqueId, providerType);
    if (!hasProvider) {
      return NextResponse.json(
        { error: `${providerType} payment provider not configured for this mosque` },
        { status: 400 }
      );
    }

    // Create payment based on provider type
    let paymentResult;
    
    if (providerType === 'billplz') {
      paymentResult = await PaymentService.createBillplzPayment({
        mosqueId,
        contributionId,
        amount,
        payerName,
        payerEmail,
        payerMobile,
        description: description || `Khairat contribution for ${payerName}`,
      });
    } else {
      return NextResponse.json(
        { error: 'Unsupported payment provider' },
        { status: 400 }
      );
    }

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: paymentResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentId: paymentResult.paymentId,
      paymentUrl: paymentResult.paymentUrl,
      message: 'Payment created successfully'
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}