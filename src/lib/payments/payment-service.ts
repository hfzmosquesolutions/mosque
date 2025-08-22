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
      const redirectUrl = `${baseUrl}/api/webhooks/billplz/redirect`;

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
      console.log('billData',billData)
      
      // Prepare initial payment data for additional info
      const paymentData = {
        provider: 'billplz',
        billplz_id: bill.id,
        collection_id: provider.billplz_collection_id,
        created_at: new Date().toISOString(),
        callback_url: callbackUrl,
        redirect_url: redirectUrl
      };
      
      // Update contribution with bill_id, payment method and payment data
      console.log('Updating contribution ID:', request.contributionId);
      console.log('Update data:', {
        payment_method: 'billplz',
        bill_id: bill.id,
        payment_data: paymentData,
        updated_at: new Date().toISOString(),
      });
      
      const updateResult = await getSupabaseAdmin()
        .from('contributions')
        .update({
          payment_method: 'billplz',
          bill_id: bill.id,
          payment_data: paymentData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.contributionId);
        
      console.log('Update result:', updateResult);
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
    xSignature: string,
    contributionId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔍 Starting callback processing...');
      const billId = callbackData.id as string;
      console.log('💳 Processing bill ID:', billId);
      
      if (!billId) {
        console.error('❌ Missing bill ID in callback data');
        return { success: false, error: 'Missing bill ID' };
      }
      
      // Simple lookup by bill_id
      console.log('🔍 Looking up contribution by bill ID:', billId);
      const { data: contribution, error: contributionError } = await getSupabaseAdmin()
        .from('contributions')
        .select('*')
        .eq('bill_id', billId)
        .single();

      if (contributionError) {
        console.error('❌ Database error finding contribution:', contributionError);
        return { success: false, error: `Contribution lookup failed: ${contributionError.message}` };
      }
      
      if (!contribution) {
        console.error('❌ No contribution found for bill ID:', billId);
        return { success: false, error: 'Contribution not found' };
      }
      
      console.log('✅ Found contribution:', {
        id: contribution.id,
        current_status: contribution.status,
        current_amount: contribution.amount
      });

      // Update contribution status based on payment status
      const isPaid = callbackData.paid === true || callbackData.paid === 'true';
      const status = isPaid ? 'completed' : 'failed';
      const paidAmount = isPaid ? BillplzProvider.toMyr(Number(callbackData.paid_amount) || 0) : 0;
      
      console.log('💰 Payment details:', {
        paid: callbackData.paid,
        isPaid,
        status,
        paid_amount_sen: callbackData.paid_amount,
        paid_amount_myr: paidAmount,
        contribution_id: contribution.id
      });

      // Prepare detailed payment data for storage
      const paymentData = {
        provider: 'billplz',
        billplz_id: String(callbackData.id),
        paid_at: callbackData.paid_at ? String(callbackData.paid_at) : null,
        transaction_status: String(callbackData.state || 'unknown'),
        state: String(callbackData.state || 'unknown'),
        paid_amount: Number(callbackData.paid_amount) || 0,
        collection_id: String(callbackData.collection_id || ''),
        transaction_id: String(callbackData.transaction_id || ''),
        due_at: callbackData.due_at ? String(callbackData.due_at) : null,
        email: callbackData.email ? String(callbackData.email) : null,
        mobile: callbackData.mobile ? String(callbackData.mobile) : null,
        callback_processed_at: new Date().toISOString()
      };

      console.log('🔄 Updating contribution status and payment data...');
      const { data: updatedContribution, error: updateError } = await getSupabaseAdmin()
        .from('contributions')
        .update({
          status,
          amount: paidAmount,
          payment_data: paymentData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contribution.id)
        .select()
        .single();
        
      if (updateError) {
        console.error('❌ Database update failed:', updateError);
        return { success: false, error: `Database update failed: ${updateError.message}` };
      }
      
      console.log('✅ Database updated successfully:', {
        contribution_id: updatedContribution.id,
        new_status: updatedContribution.status,
        new_amount: updatedContribution.amount,
        updated_at: updatedContribution.updated_at
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Error processing Billplz callback:', error);
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