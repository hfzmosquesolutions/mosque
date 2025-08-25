import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/payments/payment-service';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TOYYIBPAY CALLBACK RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request URL:', request.url);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Parse form data from ToyyibPay callback
    const formData = await request.formData();
    const callbackData: Record<string, any> = {};
    
    // Convert FormData to object
    for (const [key, value] of formData.entries()) {
      callbackData[key] = value.toString();
    }

    // Log callback data for debugging
    console.log('📥 ToyyibPay callback data:', callbackData);

    // Extract contribution_id from query parameters
    const url = new URL(request.url);
    const contributionId = url.searchParams.get('contribution_id');
    
    // Validate required fields
    if (!callbackData.billcode) {
      console.error('❌ Missing bill code in callback');
      return NextResponse.json(
        { error: 'Missing bill code' },
        { status: 400 }
      );
    }
    
    if (!contributionId) {
      console.error('❌ Missing contribution ID in callback URL');
      return NextResponse.json(
        { error: 'Missing contribution ID' },
        { status: 400 }
      );
    }

    console.log('🔄 Processing callback for bill code:', callbackData.billcode, 'contribution ID:', contributionId);
    
    // Convert to proper ToyyibPayCallbackData structure
    const toyyibPayCallbackData = {
      refno: callbackData.refno || '',
      status: callbackData.status || '',
      reason: callbackData.reason || '',
      billcode: callbackData.billcode || '',
      order_id: callbackData.order_id || '',
      amount: callbackData.amount || '',
      transaction_id: callbackData.transaction_id || '',
      fpx_transaction_id: callbackData.fpx_transaction_id,
      fpx_sellerOrderNo: callbackData.fpx_sellerOrderNo,
      status_id: callbackData.status_id || '',
      msg: callbackData.msg || '',
    };

    // Process the callback with compound key validation
    const result = await PaymentService.processToyyibPayCallback(
      toyyibPayCallbackData,
      contributionId
    );

    if (!result.success) {
      console.error('❌ Callback processing failed:', result.error);
      console.error('❌ Full error details:', result);
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Log successful processing
    console.log('✅ ToyyibPay callback processed successfully for bill:', callbackData.billcode);
    console.log('✅ Database should be updated now');

    // Return success response to ToyyibPay
    return NextResponse.json(
      { message: 'Callback processed successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error processing ToyyibPay callback:', error);
    
    // Return error response to ToyyibPay
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests (for testing)
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      message: 'ToyyibPay callback endpoint is active',
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}