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
    
    // Get parameters from Billplz redirect
    const billplzId = searchParams.get('billplz[id]');
    const billplzPaid = searchParams.get('billplz[paid]');
    const billplzPaidAt = searchParams.get('billplz[paid_at]');
    const billplzXSignature = searchParams.get('billplz[x_signature]');
    const contributionId = searchParams.get('contribution_id');
    
    // Validate required parameters
    if (!billplzId) {
      return redirectToError('Missing payment information');
    }

    // Get contribution details
    let contribution;
    const supabaseAdmin = getSupabaseAdmin();
    
    if (contributionId) {
      const { data, error } = await supabaseAdmin
        .from('khairat_contributions')
        .select('id, status, mosque_id, amount, payer_name')
        .eq('id', contributionId)
        .single();
      
      if (error || !data) {
        return redirectToError('Contribution not found');
      }
      contribution = data;
    } else {
      // Find contribution by payment reference
      const { data, error } = await supabaseAdmin
        .from('khairat_contributions')
        .select('id, status, mosque_id, amount, payer_name')
        .eq('payment_reference', billplzId)
        .single();
      
      if (error || !data) {
        return redirectToError('Contribution not found');
      }
      contribution = data;
    }

    // Verify X-Signature if provided
    if (billplzXSignature) {
      const callbackData = {
        id: billplzId,
        paid: billplzPaid === 'true',
        paid_at: billplzPaidAt,
      };

      const verificationResult = await PaymentService.processBillplzCallback(
        callbackData,
        billplzXSignature
      );

      if (!verificationResult.success) {
        console.warn('X-Signature verification failed on redirect:', verificationResult.error);
        // Continue anyway as this is just a redirect, callback will handle the actual verification
      }
    }

    // Get current payment status
    const statusResult = await PaymentService.getPaymentStatus(
      billplzId,
      contribution.mosque_id,
      'billplz'
    );

    // Determine payment status
    let paymentStatus = 'pending';
    let statusMessage = 'Payment is being processed';
    
    if (statusResult.success) {
      if (statusResult.status === 'completed' || billplzPaid === 'true') {
        paymentStatus = 'success';
        statusMessage = 'Payment completed successfully';
      } else if (statusResult.status === 'failed') {
        paymentStatus = 'failed';
        statusMessage = 'Payment failed';
      } else if (statusResult.status === 'overdue') {
        paymentStatus = 'expired';
        statusMessage = 'Payment has expired';
      }
    }

    // Redirect to payment result page with status
    const redirectUrl = new URL('/khairat/payment-result', request.url);
    redirectUrl.searchParams.set('status', paymentStatus);
    redirectUrl.searchParams.set('message', statusMessage);
    redirectUrl.searchParams.set('contributionId', contribution.id);
    redirectUrl.searchParams.set('paymentId', billplzId);
    redirectUrl.searchParams.set('amount', contribution.amount.toString());
    redirectUrl.searchParams.set('payerName', contribution.payer_name);

    return NextResponse.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('Error processing Billplz redirect:', error);
    return redirectToError('An error occurred while processing your payment');
  }
}

// Helper function to redirect to error page
function redirectToError(message: string) {
  const errorUrl = new URL('/khairat/payment-result', 'http://localhost:3000');
  errorUrl.searchParams.set('status', 'error');
  errorUrl.searchParams.set('message', message);
  
  return NextResponse.redirect(errorUrl.toString());
}

// Handle POST requests (some payment gateways might use POST for redirects)
export async function POST(request: NextRequest) {
  // For POST redirects, extract data from form and redirect to GET with query params
  try {
    const formData = await request.formData();
    const redirectUrl = new URL(request.url);
    
    // Convert form data to query parameters
    for (const [key, value] of formData.entries()) {
      redirectUrl.searchParams.set(key, value.toString());
    }
    
    // Redirect to GET handler
    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Error processing POST redirect:', error);
    return redirectToError('An error occurred while processing your payment');
  }
}