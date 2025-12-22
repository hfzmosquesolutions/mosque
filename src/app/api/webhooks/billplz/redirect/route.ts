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
    const contributionId = searchParams.get('contribution_id');
    
    console.log('📥 Billplz redirect parameters:', {
      billplzId,
      billplzPaid,
      billplzPaidAt,
      billplzXSignature: billplzXSignature ? '***provided***' : 'not provided',
      contributionId
    });
   
    // Validate required parameters
    if (!billplzId) {
      console.error('❌ Missing payment information (billplz[id])');
      return redirectToError('Missing payment information');
    }
    
    if (!contributionId) {
      console.error('❌ Missing contribution ID');
      return redirectToError('Missing contribution information');
    }

    // Get contribution details using compound key (contribution_id + bill_id)
    const supabaseAdmin = getSupabaseAdmin();
    
    console.log('🔍 Looking up contribution by compound key:', { contributionId, billplzId });
    const { data: contribution, error } = await supabaseAdmin
      .from('khairat_contributions')
      .select(`
        id, 
        status, 
        amount,
        mosque_id, 
        contributor_id,
        payment_id,
        payment_reference,
        payment_data,
        contributor_name
      `)
      .eq('id', contributionId)
      .eq('bill_id', billplzId)
      .single();
    
    if (error) {
      console.error('❌ Database error finding contribution by compound key:', error);
      return redirectToError('Contribution not found');
    }
    if (!contribution) {
      console.error('❌ No contribution found with compound key:', { contributionId, billplzId });
      return redirectToError('Contribution not found');
    }
    
    console.log('✅ Found contribution:', {
      id: contribution.id,
      current_status: contribution.status,
      current_amount: contribution.amount,
      contributor_id: contribution.contributor_id,
      contributor_name: contribution.contributor_name
    });

    // X-Signature verification disabled for redirect - callback webhook handles the authoritative verification
    if (billplzXSignature) {
      console.log('ℹ️ X-Signature provided but verification skipped for redirect');
    } else {
      console.log('ℹ️ No X-Signature provided in redirect');
    }
    console.log('ℹ️ Note: X-Signature verification is handled by the callback webhook for security');

    console.log('💰 Payment details from redirect:', {
      billplzId,
      billplzPaid,
      isPaid: billplzPaid === 'true',
      contributionId: contribution.id
    });
    
    // Also process the payment callback for immediate database updates (redundancy for delayed webhooks)
    console.log('🔄 Processing payment callback for immediate database update...');
    try {
      // Construct callback data from redirect parameters
      const callbackData = {
        id: billplzId,
        paid: billplzPaid || 'false',
        paid_at: billplzPaidAt || ''
      };
      
      console.log('📤 Constructed callback data for processing:', callbackData);
      
      // Process the callback to update database immediately
      const callbackResult = await PaymentService.processBillplzCallback(callbackData, contributionId);
      console.log('📋 Payment callback result:', callbackResult);
      
      if (callbackResult.success) {
        console.log('✅ Payment callback processed successfully via redirect');
      } else {
        console.log('⚠️ Payment callback processing failed:', callbackResult.error);
      }
      
    } catch (callbackError) {
      console.error('⚠️ Error processing callback via redirect (non-fatal):', callbackError);
      console.log('ℹ️ Payment will still be processed by the webhook callback');
    }
    
    console.log('ℹ️ Note: Payment data updated immediately + webhook callback provides additional redundancy');

    // Attempt to resolve khairat membership number for the contributor
    let membershipNumber = contribution.payment_data?.membership_number || '';
    try {
      if (!membershipNumber && contribution.contributor_id) {
        const { data: member } = await supabaseAdmin
          .from('khairat_members')
          .select('membership_number')
          .eq('mosque_id', contribution.mosque_id)
          .eq('user_id', contribution.contributor_id)
          .in('status', ['active', 'approved'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        membershipNumber = member?.membership_number || '';
      }
    } catch (e) {
      console.log('ℹ️ Unable to resolve membership number:', e);
    }

    // Determine payment status for redirect
    const isPaid = billplzPaid === 'true';
    const isFailed = billplzPaid === 'false';
    let paymentStatus = 'pending';
    let statusMessage = 'Payment is being processed';
    
    if (isPaid) {
      paymentStatus = 'success';
      statusMessage = 'Payment completed successfully';
      console.log('✅ Payment determined as SUCCESS');
    } else if (isFailed) {
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
    redirectUrl.searchParams.set('paymentId', contribution.payment_id || '');
    redirectUrl.searchParams.set('billId', billplzId);
    redirectUrl.searchParams.set('amount', contribution.amount.toString());
    redirectUrl.searchParams.set('payerName', contribution.contributor_name);
    redirectUrl.searchParams.set('mosqueId', contribution.mosque_id);
    if (membershipNumber) {
      redirectUrl.searchParams.set('membershipNumber', membershipNumber);
    }
    
    console.log('🔄 Redirect URL parameters:', {
      status: paymentStatus,
      message: statusMessage,
      contributionId: contribution.id,
      paymentId: contribution.payment_id || '',
      billId: billplzId,
      amount: contribution.amount.toString(),
      payerName: contribution.contributor_name,
      mosqueId: contribution.mosque_id,
      membershipNumber
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
