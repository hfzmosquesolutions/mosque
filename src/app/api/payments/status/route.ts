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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const contributionId = searchParams.get('contributionId');
    const providerType = searchParams.get('providerType') || 'billplz';

    if (!paymentId && !contributionId) {
      return NextResponse.json(
        { error: 'Payment ID or Contribution ID is required' },
        { status: 400 }
      );
    }

    let mosqueId: string;
    let actualPaymentId: string;
    const supabaseAdmin = getSupabaseAdmin();

    if (contributionId) {
      // Get contribution details
      const { data: contribution, error: contributionError } = await supabaseAdmin
        .from('khairat_contributions')
        .select('id, status, mosque_id, payment_reference, payment_method')
        .eq('id', contributionId)
        .single();

      if (contributionError || !contribution) {
        return NextResponse.json(
          { error: 'Contribution not found' },
          { status: 404 }
        );
      }

      mosqueId = contribution.mosque_id;
      actualPaymentId = contribution.payment_reference || paymentId || '';

      // If no payment reference, return contribution status
      if (!contribution.payment_reference) {
        return NextResponse.json({
          success: true,
          status: contribution.status,
          paymentMethod: contribution.payment_method,
          message: 'No payment initiated yet'
        });
      }
    } else {
      // If only payment ID provided, try to find contribution
      const { data: contribution, error: contributionError } = await supabaseAdmin
        .from('khairat_contributions')
        .select('id, status, mosque_id, payment_method')
        .eq('payment_reference', paymentId)
        .single();

      if (contributionError || !contribution) {
        return NextResponse.json(
          { error: 'Contribution not found for this payment' },
          { status: 404 }
        );
      }

      mosqueId = contribution.mosque_id;
      actualPaymentId = paymentId!;
    }

    // Get payment status from provider
    const statusResult = await PaymentService.getPaymentStatus(
      actualPaymentId,
      mosqueId,
      providerType as 'billplz' | 'chip' | 'stripe'
    );

    if (!statusResult.success) {
      return NextResponse.json(
        { error: statusResult.error },
        { status: 500 }
      );
    }

    // Also get current contribution status from database
    const { data: currentContribution } = await supabaseAdmin
      .from('khairat_contributions')
      .select('status, amount, updated_at')
      .eq('payment_reference', actualPaymentId)
      .single();

    return NextResponse.json({
      success: true,
      paymentId: actualPaymentId,
      providerStatus: statusResult.status,
      contributionStatus: currentContribution?.status,
      amount: currentContribution?.amount,
      lastUpdated: currentContribution?.updated_at,
      message: 'Payment status retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting payment status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}