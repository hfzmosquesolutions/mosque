import { NextRequest, NextResponse } from 'next/server';
import { BillplzProvider } from '@/lib/payments/providers/billplz';
import { ToyyibPayProvider } from '@/lib/payments/providers/toyyibpay';
import { PaymentService } from '@/lib/payments/payment-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      providerType, 
      collectionId, 
      categoryCode, 
      isSandbox = true,
      mosqueId
    } = body;
    let apiKey = body.apiKey;
    let secretKey = body.secretKey;

    if (!providerType) {
      return NextResponse.json(
        { error: 'Provider type is required' },
        { status: 400 }
      );
    }

    // Handle masked credentials
    // If credentials are masked (start with ****) and we have mosqueId, try to fetch real credentials
    if (mosqueId) {
      const isApiKeyMasked = apiKey && apiKey.startsWith('****');
      const isSecretKeyMasked = secretKey && secretKey.startsWith('****');
      
      if (isApiKeyMasked || isSecretKeyMasked) {
        try {
          const provider = await PaymentService.getPaymentProvider(mosqueId, providerType);
          
          if (provider) {
            if (isApiKeyMasked && providerType === 'billplz' && provider.billplz_api_key) {
              apiKey = provider.billplz_api_key;
            }
            
            if (isSecretKeyMasked && providerType === 'toyyibpay' && provider.toyyibpay_secret_key) {
              secretKey = provider.toyyibpay_secret_key;
            }
          }
        } catch (error) {
          console.error('Error fetching payment provider for test:', error);
          // Continue with original values, will likely fail if still masked
        }
      }
    }

    // Validate provider-specific fields
    if (providerType === 'billplz' && (!apiKey || !collectionId)) {
      return NextResponse.json(
        { error: 'API key and collection ID are required for Billplz' },
        { status: 400 }
      );
    }

    if (providerType === 'toyyibpay' && (!secretKey || !categoryCode)) {
      return NextResponse.json(
        { error: 'Secret key and category code are required for ToyyibPay' },
        { status: 400 }
      );
    }

    if (providerType === 'billplz') {
      try {
        // Create a temporary Billplz provider instance for testing
        const billplz = new BillplzProvider({
          apiKey,
          xSignatureKey: 'test-signature', // Not needed for collection test
          collectionId,
          isSandbox,
        });

        // Test by trying to get collection information
        const testResult = await billplz.getCollection();
        
        if (testResult) {
          return NextResponse.json({
            success: true,
            message: 'Connection successful',
            collectionInfo: {
              id: testResult.id,
              title: testResult.title,
              status: testResult.status,
            },
          });
        } else {
          return NextResponse.json(
            { error: 'Failed to retrieve collection information' },
            { status: 400 }
          );
        }
      } catch (error: any) {
        console.error('Billplz connection test failed:', error);
        
        // Parse Billplz error response
        let errorMessage = 'Connection test failed';
        if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        return NextResponse.json(
          { error: errorMessage },
          { status: 400 }
        );
      }
    } else if (providerType === 'toyyibpay') {
      try {
        // Create a temporary ToyyibPay provider instance for testing
        const toyyibpay = new ToyyibPayProvider({
          secretKey,
          categoryCode,
          isSandbox,
        });

        // Test by trying to get category details (validates both secretKey and categoryCode)
        const testResult = await toyyibpay.getCategoryDetails();
        
        if (testResult && typeof testResult === 'object' && testResult.CategoryName) {
          return NextResponse.json({
            success: true,
            message: 'Connection successful',
            connectionInfo: {
              name: testResult.CategoryName,
              description: testResult.CategoryDescription,
            },
          });
        } else {
          return NextResponse.json(
            { error: 'Failed to retrieve category information' },
            { status: 400 }
          );
        }
      } catch (error: any) {
        console.error('ToyyibPay connection test failed:', error);
        
        // Parse ToyyibPay error response
        let errorMessage = 'Connection test failed';
        
        if (Array.isArray(error.response?.data)) {
          // ToyyibPay sometimes returns array of errors
          errorMessage = error.response.data.map((e: any) => e.msg).join(', ');
        } else if (error.response?.data?.msg) {
          errorMessage = error.response.data.msg;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        return NextResponse.json(
          { error: errorMessage },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid provider type' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Connection test error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
