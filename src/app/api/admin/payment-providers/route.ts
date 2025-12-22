import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encryptCredential, maskCredential, decryptIfNeeded } from '@/lib/encryption';
import { reencryptProviderCredentials } from '@/lib/encryption-rotation';

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
      // Mask sensitive credentials before returning to client
      const maskedProvider = {
        ...provider,
        billplz_api_key: maskCredential(provider.billplz_api_key),
        billplz_x_signature_key: maskCredential(provider.billplz_x_signature_key),
        toyyibpay_secret_key: maskCredential(provider.toyyibpay_secret_key),
        stripe_secret_key: maskCredential(provider.stripe_secret_key),
        chip_api_key: maskCredential(provider.chip_api_key),
      };

      if (provider.provider_type === 'billplz') {
        result.billplz = maskedProvider;
        result.hasBillplz = provider.is_active;
      } else if (provider.provider_type === 'chip') {
        result.chip = maskedProvider;
        result.hasChip = provider.is_active;
      } else if (provider.provider_type === 'stripe') {
        result.stripe = maskedProvider;
        result.hasStripe = provider.is_active;
      } else if (provider.provider_type === 'toyyibpay') {
        result.toyyibpay = maskedProvider;
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

  // Resolve masked or missing credentials by fetching existing provider values
  const supabaseAdmin = getSupabaseAdmin();
  let resolvedBillplzApiKey = billplz_api_key;
  let resolvedBillplzXSignatureKey = billplz_x_signature_key;
  let resolvedBillplzCollectionId = billplz_collection_id;
  let resolvedToyyibpaySecretKey = toyyibpay_secret_key;
  let resolvedToyyibpayCategoryCode = toyyibpay_category_code;

  try {
    const { data: existingProvider } = await supabaseAdmin
      .from('mosque_payment_providers')
      .select('*')
      .eq('mosque_id', mosqueId)
      .eq('provider_type', providerType)
      .single();

    if (providerType === 'billplz' && existingProvider) {
      if (
        (!resolvedBillplzApiKey || resolvedBillplzApiKey.startsWith('****')) &&
        existingProvider.billplz_api_key
      ) {
        resolvedBillplzApiKey = decryptIfNeeded(existingProvider.billplz_api_key);
      }
      if (
        (!resolvedBillplzXSignatureKey || resolvedBillplzXSignatureKey.startsWith('****')) &&
        existingProvider.billplz_x_signature_key
      ) {
        resolvedBillplzXSignatureKey = decryptIfNeeded(existingProvider.billplz_x_signature_key);
      }
      if (!resolvedBillplzCollectionId && existingProvider.billplz_collection_id) {
        resolvedBillplzCollectionId = existingProvider.billplz_collection_id;
      }
    }

    if (providerType === 'toyyibpay' && existingProvider) {
      if (
        (!resolvedToyyibpaySecretKey || resolvedToyyibpaySecretKey.startsWith('****')) &&
        existingProvider.toyyibpay_secret_key
      ) {
        resolvedToyyibpaySecretKey = decryptIfNeeded(existingProvider.toyyibpay_secret_key);
      }
      if (!resolvedToyyibpayCategoryCode && existingProvider.toyyibpay_category_code) {
        resolvedToyyibpayCategoryCode = existingProvider.toyyibpay_category_code;
      }
    }
  } catch (resolveError) {
    console.warn('Warning resolving existing provider credentials:', resolveError);
    // Continue; validation below will catch missing fields
  }

  // Validate required fields for active providers
  if (is_active && providerType === 'billplz') {
    if (!resolvedBillplzApiKey || !resolvedBillplzXSignatureKey || !resolvedBillplzCollectionId) {
      return NextResponse.json(
        { error: 'API Key, X-Signature Key, and Collection ID are required for active Billplz provider' },
        { status: 400 }
      );
    }
  }
  
  if (is_active && providerType === 'toyyibpay') {
    if (!resolvedToyyibpaySecretKey || !resolvedToyyibpayCategoryCode) {
      return NextResponse.json(
        { error: 'Secret Key and Category Code are required for active ToyyibPay provider' },
        { status: 400 }
      );
    }
  }

  // Encrypt credentials before storing
  // If credentials are already encrypted with old key, they'll be re-encrypted with new key
  const encryptedBillplzApiKey = resolvedBillplzApiKey ? encryptCredential(resolvedBillplzApiKey) : null;
  const encryptedBillplzXSignatureKey = resolvedBillplzXSignatureKey ? encryptCredential(resolvedBillplzXSignatureKey) : null;
  const encryptedToyyibpaySecretKey = resolvedToyyibpaySecretKey ? encryptCredential(resolvedToyyibpaySecretKey) : null;
  
  // Note: During key rotation, if old credentials exist in DB, they'll be automatically
  // re-encrypted on next update. For immediate rotation, use the rotation script.

  // Use the upsert function to save payment provider
  const { data, error } = await supabaseAdmin.rpc('upsert_mosque_payment_provider', {
    p_mosque_id: mosqueId,
    p_provider_type: providerType,
    p_is_active: is_active,
    p_is_sandbox: is_sandbox,
    p_billplz_api_key: encryptedBillplzApiKey,
    p_billplz_x_signature_key: encryptedBillplzXSignatureKey,
    p_billplz_collection_id: resolvedBillplzCollectionId || null,
    p_toyyibpay_secret_key: encryptedToyyibpaySecretKey,
    p_toyyibpay_category_code: resolvedToyyibpayCategoryCode || null,
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
