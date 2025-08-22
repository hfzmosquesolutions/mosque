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
    console.log('=== BILLPLZ REDIRECT RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request URL:', request.url);
    
    const { searchParams } = new URL(request.url);
    
    // Get parameters from Billplz redirect
    const billplzId = searchParams.get('billplz[id]');
    const billplzPaid = searchParams.get('billplz[paid]');
    const billplzPaidAt = searchParams.get('billplz[paid_at]');
    const billplzXSignature = searchParams.get('billplz[x_signature]');
    
    console.log('📥 Billplz redirect parameters:', {
      billplzId,
      billplzPaid,
      billplzPaidAt,
      billplzXSignature: billplzXSignature ? '***provided***' : 'not provided'
    });
   
    // Validate required parameters
    if (!billplzId) {
      console.error('❌ Missing payment information (billplz[id])');
      return redirectToError('Missing payment information');
    }

    // Get contribution details using bill_id
    const supabaseAdmin = getSupabaseAdmin();
    
    console.log('🔍 Looking up contribution by bill ID:', billplzId);
    const { data: contribution, error } = await supabaseAdmin
      .from('contributions')
      .select(`
        id, 
        status, 
        amount, 
        contributor_name
      `)
      .eq('bill_id', billplzId)
      .single();
    
    if (error) {
      console.error('❌ Database error finding contribution by bill ID:', error);
      return redirectToError('Contribution not found');
    }
    if (!contribution) {
      console.error('❌ No contribution found with bill ID:', billplzId);
      return redirectToError('Contribution not found');
    }
    
    console.log('✅ Found contribution:', {
      id: contribution.id,
      current_status: contribution.status,
      current_amount: contribution.amount,
      contributor_name: contribution.contributor_name
    });

    // Verify X-Signature if provided
    if (billplzXSignature) {
      console.log('🔐 X-Signature provided, attempting verification...');
      const callbackData = {
        id: billplzId,
        paid: billplzPaid === 'true',
        paid_at: billplzPaidAt,
      };
      
      console.log('🔐 Callback data for verification:', callbackData);

      const verificationResult = await PaymentService.processBillplzCallback(
        callbackData,
        billplzXSignature
      );

      if (!verificationResult.success) {
        console.warn('⚠️ X-Signature verification failed on redirect:', verificationResult.error);
        console.warn('⚠️ Continuing anyway as this is just a redirect, callback will handle the actual verification');
      } else {
        console.log('✅ X-Signature verification successful on redirect');
      }
    } else {
      console.log('ℹ️ No X-Signature provided in redirect');
    }

    console.log('💰 Payment details from redirect:', {
      billplzId,
      billplzPaid,
      isPaid: billplzPaid === 'true',
      contributionId: contribution.id
    });
    
    console.log('ℹ️ Note: Payment data will be updated by the callback webhook for comprehensive tracking');

    // Determine payment status for redirect
    const isPaid = billplzPaid === 'true';
    let paymentStatus = 'pending';
    let statusMessage = 'Payment is being processed';
    
    if (isPaid) {
      paymentStatus = 'success';
      statusMessage = 'Payment completed successfully';
      console.log('✅ Payment determined as SUCCESS');
    } else {
      console.log('⏳ Payment determined as PENDING');
    }

    // Redirect to payment result page with status
    console.log('🔄 Preparing redirect to payment result page...');
    const redirectUrl = new URL('/khairat/payment-result', request.url);
    redirectUrl.searchParams.set('status', paymentStatus);
    redirectUrl.searchParams.set('message', statusMessage);
    redirectUrl.searchParams.set('contributionId', contribution.id);
    redirectUrl.searchParams.set('paymentId', billplzId);
    redirectUrl.searchParams.set('amount', contribution.amount.toString());
    redirectUrl.searchParams.set('payerName', contribution.contributor_name);
    
    console.log('🔄 Redirect URL parameters:', {
      status: paymentStatus,
      message: statusMessage,
      contributionId: contribution.id,
      paymentId: billplzId,
      amount: contribution.amount.toString(),
      payerName: contribution.contributor_name
    });
    
    console.log('🔄 Final redirect URL:', redirectUrl.toString());

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