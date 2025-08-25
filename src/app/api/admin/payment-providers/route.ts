import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client only when needed
function getSupabaseAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mosqueId = searchParams.get('mosqueId');
  
    if (!mosqueId) {
      return NextResponse.json(
        { error: 'Mosque ID is required' },
        { status: 400 }
      );
    }

    // Get all payment providers for the mosque
    const supabaseAdmin = getSupabaseAdmin();
    const { data: providers, error } = await supabaseAdmin
      .from('mosque_payment_providers')
      .select('*')
      .eq('mosque_id', mosqueId);

    if (error) {
      console.error('Error fetching payment providers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payment providers' },
        { status: 500 }
      );
    }

    // Organize providers by type
    const result: Record<string, any> = {
      hasBillplz: false,
      hasChip: false,
      hasStripe: false,
      hasToyyibpay: false,
    };

    providers?.forEach(provider => {
      if (provider.provider_type === 'billplz') {
        result.billplz = provider;
        result.hasBillplz = provider.is_active;
      } else if (provider.provider_type === 'chip') {
        result.chip = provider;
        result.hasChip = provider.is_active;
      } else if (provider.provider_type === 'stripe') {
        result.stripe = provider;
        result.hasStripe = provider.is_active;
      } else if (provider.provider_type === 'toyyibpay') {
        result.toyyibpay = provider;
        result.hasToyyibpay = provider.is_active;
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/admin/payment-providers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleUpsertPaymentProvider(request: NextRequest) {
  const body = await request.json();
  const {
    mosqueId,
    providerType,
    billplz_api_key,
    billplz_x_signature_key,
    billplz_collection_id,
    toyyibpay_secret_key,
    toyyibpay_category_code,
    is_sandbox = true,
    is_active = false,
  } = body;

  if (!mosqueId || !providerType) {
    return NextResponse.json(
      { error: 'Mosque ID and provider type are required' },
      { status: 400 }
    );
  }

  // Validate required fields for active providers
  if (is_active && providerType === 'billplz') {
    if (!billplz_api_key || !billplz_x_signature_key || !billplz_collection_id) {
      return NextResponse.json(
        { error: 'API Key, X-Signature Key, and Collection ID are required for active Billplz provider' },
        { status: 400 }
      );
    }
  }
  
  if (is_active && providerType === 'toyyibpay') {
    if (!toyyibpay_secret_key || !toyyibpay_category_code) {
      return NextResponse.json(
        { error: 'Secret Key and Category Code are required for active ToyyibPay provider' },
        { status: 400 }
      );
    }
  }

  // Use the upsert function to save payment provider
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.rpc('upsert_mosque_payment_provider', {
    p_mosque_id: mosqueId,
    p_provider_type: providerType,
    p_is_active: is_active,
    p_is_sandbox: is_sandbox,
    p_billplz_api_key: billplz_api_key || null,
    p_billplz_x_signature_key: billplz_x_signature_key || null,
    p_billplz_collection_id: billplz_collection_id || null,
    p_toyyibpay_secret_key: toyyibpay_secret_key || null,
    p_toyyibpay_category_code: toyyibpay_category_code || null,
  });

  if (error) {
    console.error('Error upserting payment provider:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save payment provider' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  try {
    return await handleUpsertPaymentProvider(request);
  } catch (error) {
    console.error('Error in POST /api/admin/payment-providers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    return await handleUpsertPaymentProvider(request);
  } catch (error) {
    console.error('Error in PUT /api/admin/payment-providers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}