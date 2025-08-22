import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/payments/payment-service';

export async function POST(request: NextRequest) {
  try {
    console.log('=== BILLPLZ CALLBACK RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request URL:', request.url);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Get X-Signature from headers
    const xSignature = request.headers.get('x-signature');
    
    if (!xSignature) {
      console.error('❌ Missing X-Signature header');
      return NextResponse.json(
        { error: 'Missing X-Signature header' },
        { status: 400 }
      );
    }

    // Parse form data from Billplz callback
    const formData = await request.formData();
    const callbackData: Record<string, any> = {};
    
    // Convert FormData to object
    for (const [key, value] of formData.entries()) {
      callbackData[key] = value.toString();
    }

    // Log callback data for debugging
    console.log('📥 Billplz callback data:', {
      ...callbackData,
      x_signature: xSignature
    });

    // Validate required fields
    if (!callbackData.id) {
      console.error('❌ Missing bill ID in callback');
      return NextResponse.json(
        { error: 'Missing bill ID' },
        { status: 400 }
      );
    }

    console.log('🔄 Processing callback for bill ID:', callbackData.id);
    
    // Process the callback
    const result = await PaymentService.processBillplzCallback(
      callbackData,
      xSignature
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
    console.log('✅ Billplz callback processed successfully for bill:', callbackData.id);
    console.log('✅ Database should be updated now');

    // Return success response to Billplz
    return NextResponse.json(
      { message: 'Callback processed successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error processing Billplz callback:', error);
    
    // Return error response to Billplz
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
      message: 'Billplz callback endpoint is active',
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}