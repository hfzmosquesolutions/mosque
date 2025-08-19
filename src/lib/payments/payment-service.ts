import { createClient } from '@supabase/supabase-js';
import { BillplzProvider, BillplzConfig } from './providers/billplz';

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

export type PaymentProviderType = 'billplz' | 'chip' | 'stripe';

export interface PaymentProvider {
  id: string;
  mosque_id: string;
  provider_type: PaymentProviderType;
  is_active: boolean;
  is_sandbox: boolean;
  billplz_api_key?: string;
  billplz_x_signature_key?: string;
  billplz_collection_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentRequest {
  mosqueId: string;
  contributionId: string;
  amount: number; // in MYR
  payerName: string;
  payerEmail?: string;
  payerMobile?: string;
  description: string;
  reference?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  paymentUrl?: string;
  error?: string;
}

export class PaymentService {
  /**
   * Get payment provider for a mosque
   */
  static async getPaymentProvider(
    mosqueId: string,
    providerType: PaymentProviderType
  ): Promise<PaymentProvider | null> {
    const { data, error } = await getSupabaseAdmin().rpc('get_mosque_payment_provider', {
      p_mosque_id: mosqueId,
      p_provider_type: providerType,
    });

    if (error) {
      console.error('Error fetching payment provider:', error);
      return null;
    }

    return data;
  }

  /**
   * Check if mosque has active payment provider
   */
  static async hasPaymentProvider(
    mosqueId: string,
    providerType: PaymentProviderType
  ): Promise<boolean> {
    const { data, error } = await getSupabaseAdmin().rpc('mosque_has_payment_provider', {
      p_mosque_id: mosqueId,
      p_provider_type: providerType,
    });

    if (error) {
      console.error('Error checking payment provider:', error);
      return false;
    }

    return data || false;
  }

  /**
   * Create payment using Billplz
   */
  static async createBillplzPayment(
    request: CreatePaymentRequest
  ): Promise<PaymentResponse> {
    try {
      // Get Billplz provider for the mosque
      const provider = await this.getPaymentProvider(request.mosqueId, 'billplz');
      
      if (!provider || !provider.billplz_api_key || !provider.billplz_collection_id) {
        return {
          success: false,
          error: 'Billplz not configured for this mosque',
        };
      }

      // Create Billplz client
      const billplzConfig: BillplzConfig = {
        apiKey: provider.billplz_api_key,
        xSignatureKey: provider.billplz_x_signature_key!,
        collectionId: provider.billplz_collection_id,
        isSandbox: provider.is_sandbox,
      };

      const billplz = new BillplzProvider(billplzConfig);

      // Generate callback and redirect URLs
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const callbackUrl = `${baseUrl}/api/webhooks/billplz/callback`;
      const redirectUrl = `${baseUrl}/api/webhooks/billplz/redirect?contribution_id=${request.contributionId}`;

      // Create bill
      const billData = {
        collection_id: provider.billplz_collection_id,
        name: request.payerName,
        email: request.payerEmail,
        mobile: request.payerMobile,
        amount: BillplzProvider.toSen(request.amount), // Convert to sen
        description: request.description,
        callback_url: callbackUrl,
        redirect_url: redirectUrl,
        reference_1_label: 'Contribution ID',
        reference_1: request.contributionId,
        reference_2_label: 'Mosque ID',
        reference_2: request.mosqueId,
      };

      const bill = await billplz.createBill(billData);

      // Update contribution with payment reference
      await getSupabaseAdmin()
        .from('khairat_contributions')
        .update({
          payment_method: 'billplz',
          payment_reference: bill.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.contributionId);

      return {
        success: true,
        paymentId: bill.id,
        paymentUrl: bill.url,
      };
    } catch (error) {
      console.error('Error creating Billplz payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process payment callback
   */
  static async processBillplzCallback(
    callbackData: Record<string, unknown>,
    xSignature: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const billId = callbackData.id;
      
      // Get contribution by payment reference
      const { data: contribution, error: contributionError } = await getSupabaseAdmin()
        .from('khairat_contributions')
        .select('*, mosques(id)')
        .eq('payment_reference', billId)
        .single();

      if (contributionError || !contribution) {
        return { success: false, error: 'Contribution not found' };
      }

      // Get payment provider to verify signature
      const provider = await this.getPaymentProvider(
        contribution.mosques.id,
        'billplz'
      );

      if (!provider || !provider.billplz_x_signature_key) {
        return { success: false, error: 'Payment provider not configured' };
      }

      // Create Billplz client for signature verification
      const billplzConfig: BillplzConfig = {
        apiKey: provider.billplz_api_key!,
        xSignatureKey: provider.billplz_x_signature_key,
        collectionId: provider.billplz_collection_id!,
        isSandbox: provider.is_sandbox,
      };

      const billplz = new BillplzProvider(billplzConfig);

      // Verify X-Signature
      if (!billplz.verifyXSignature(callbackData, xSignature)) {
        return { success: false, error: 'Invalid signature' };
      }

      // Update contribution status based on payment status
      const status = callbackData.paid ? 'completed' : 'failed';
      const paidAmount = callbackData.paid ? BillplzProvider.toMyr(Number(callbackData.paid_amount) || 0) : 0;

      await getSupabaseAdmin()
        .from('khairat_contributions')
        .update({
          status,
          amount: paidAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contribution.id);

      return { success: true };
    } catch (error) {
      console.error('Error processing Billplz callback:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get payment status
   */
  static async getPaymentStatus(
    paymentId: string,
    mosqueId: string,
    providerType: PaymentProviderType = 'billplz'
  ): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      if (providerType === 'billplz') {
        const provider = await this.getPaymentProvider(mosqueId, 'billplz');
        
        if (!provider) {
          return { success: false, error: 'Payment provider not found' };
        }

        const billplzConfig: BillplzConfig = {
          apiKey: provider.billplz_api_key!,
          xSignatureKey: provider.billplz_x_signature_key!,
          collectionId: provider.billplz_collection_id!,
          isSandbox: provider.is_sandbox,
        };

        const billplz = new BillplzProvider(billplzConfig);
        const bill = await billplz.getBill(paymentId);

        return {
          success: true,
          status: bill.paid ? 'completed' : bill.state,
        };
      }

      return { success: false, error: 'Unsupported provider type' };
    } catch (error) {
      console.error('Error getting payment status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}