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
    console.log('=== TOYYIBPAY REDIRECT RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request URL:', request.url);
    
    const { searchParams } = new URL(request.url);
    
    // Get parameters from ToyyibPay redirect
    const statusId = searchParams.get('status_id');
    const billCode = searchParams.get('billcode');
    const orderNumber = searchParams.get('order_id');
    const contributionId = searchParams.get('contribution_id');
    
    console.log('📥 ToyyibPay redirect parameters:', {
      statusId,
      billCode,
      orderNumber,
      contributionId
    });
   
    // Validate required parameters
    if (!billCode) {
      console.error('❌ Missing payment information (billcode)');
      return redirectToError('Missing payment information');
    }

    if (!contributionId) {
      console.error('❌ Missing contribution ID');
      return redirectToError('Missing contribution information');
    }

    // Get contribution details using compound key (contribution_id + bill_id)
    const supabaseAdmin = getSupabaseAdmin();
    
    console.log('🔍 Looking up contribution by compound key:', { contributionId, billCode });
    const { data: contribution, error } = await supabaseAdmin
      .from('khairat_contributions')
      .select(`
        id, 
        status, 
        amount, 
        contributor_name
      `)
      .eq('id', contributionId)
      .eq('bill_id', billCode)
      .single();
    
    if (error) {
      console.error('❌ Database error finding contribution by compound key:', error);
      return redirectToError('Contribution not found');
    }
    if (!contribution) {
      console.error('❌ No contribution found with compound key:', { contributionId, billCode });
      return redirectToError('Contribution not found');
    }
    
    console.log('✅ Found contribution:', {
      id: contribution.id,
      current_status: contribution.status,
      current_amount: contribution.amount,
      contributor_name: contribution.contributor_name
    });

    console.log('💰 Payment details from redirect:', {
      billCode,
      statusId,
      orderNumber,
      contributionId: contribution.id
    });
    
    // Also process the callback for immediate database updates (redundancy)
    console.log('🔄 Processing callback from redirect for immediate database update...');
    try {
      // Construct ToyyibPayCallbackData from redirect parameters
      const toyyibPayCallbackData = {
        refno: '',
        status: statusId === '1' ? 'success' : statusId === '3' ? 'failed' : 'pending',
        reason: '',
        billcode: billCode,
        order_id: orderNumber || '',
        amount: contribution.amount.toString(),
        transaction_id: '',
        fpx_transaction_id: undefined,
        fpx_sellerOrderNo: undefined,
        status_id: statusId || '',
        msg: '',
      };

      const callbackResult = await PaymentService.processToyyibPayCallback(
        toyyibPayCallbackData,
        contributionId
      );

      console.log('📊 Callback processing result from redirect:', callbackResult);
      if (callbackResult.success) {
        console.log('✅ Payment status updated successfully via redirect');
      } else {
        console.log('❌ Callback processing failed via redirect:', callbackResult.error);
      }
    } catch (callbackError) {
      console.error('❌ Error processing callback from redirect:', callbackError);
      // Don't fail the redirect if callback processing fails
    }
    
    console.log('ℹ️ Note: Payment data is also updated by the callback webhook for comprehensive tracking');

    // Determine payment status for redirect based on ToyyibPay status_id
    // status_id: 1 = successful payment, 2 = pending payment, 3 = unsuccessful payment
    let paymentStatus = 'pending';
    let statusMessage = 'Payment is being processed';
    
    if (statusId === '1') {
      paymentStatus = 'success';
      statusMessage = 'Payment completed successfully';
      console.log('✅ Payment determined as SUCCESS');
    } else if (statusId === '3') {
      paymentStatus = 'failed';
      statusMessage = 'Payment was unsuccessful';
      console.log('❌ Payment determined as FAILED');
    } else {
      console.log('⏳ Payment determined as PENDING');
    }

    // Redirect to payment result page with status
    console.log('🔄 Preparing redirect to payment result page...');
    const redirectUrl = new URL('/khairat/payment-result', request.url);
    redirectUrl.searchParams.set('status', paymentStatus);
    redirectUrl.searchParams.set('message', statusMessage);
    redirectUrl.searchParams.set('contributionId', contribution.id);
    redirectUrl.searchParams.set('paymentId', billCode);
    redirectUrl.searchParams.set('amount', contribution.amount.toString());
    redirectUrl.searchParams.set('payerName', contribution.contributor_name);
    
    console.log('🔄 Redirect URL parameters:', {
      status: paymentStatus,
      message: statusMessage,
      contributionId: contribution.id,
      paymentId: billCode,
      amount: contribution.amount.toString(),
      payerName: contribution.contributor_name
    });
    
    console.log('🔄 Final redirect URL:', redirectUrl.toString());

    return NextResponse.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('Error processing ToyyibPay redirect:', error);
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