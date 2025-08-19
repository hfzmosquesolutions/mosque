import { NextRequest, NextResponse } from 'next/server';
import { BillplzProvider } from '@/lib/payments/providers/billplz';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerType, apiKey, collectionId, isSandbox = true } = body;

    if (!providerType || !apiKey || !collectionId) {
      return NextResponse.json(
        { error: 'Provider type, API key, and collection ID are required' },
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
    }

    return NextResponse.json(
      { error: 'Unsupported provider type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in POST /api/admin/payment-providers/test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}