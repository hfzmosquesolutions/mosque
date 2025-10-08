import { createClient } from '@supabase/supabase-js';
import { BillplzProvider, BillplzConfig } from './providers/billplz';
import { ToyyibPayProvider, ToyyibPayConfig, ToyyibPayCallbackData } from './providers/toyyibpay';

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

export type PaymentProviderType = 'billplz' | 'chip' | 'stripe' | 'toyyibpay';

export interface PaymentProvider {
  id: string;
  mosque_id: string;
  provider_type: PaymentProviderType;
  is_active: boolean;
  is_sandbox: boolean;
  billplz_api_key?: string;
  billplz_x_signature_key?: string;
  billplz_collection_id?: string;
  toyyibpay_secret_key?: string;
  toyyibpay_category_code?: string;
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
      const callbackUrl = `${baseUrl}/api/webhooks/billplz/callback?contribution_id=${request.contributionId}`;
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
      
      // Prepare initial payment data for additional info
      const paymentData = {
        provider: 'billplz',
        billplz_id: bill.id,
        collection_id: provider.billplz_collection_id,
        created_at: new Date().toISOString(),
        callback_url: callbackUrl,
        redirect_url: redirectUrl
      };
      
      const updateResult = await getSupabaseAdmin()
        .from('khairat_contributions')
        .update({
          payment_method: 'billplz',
          bill_id: bill.id,
          payment_data: paymentData,
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
   * Create payment using ToyyibPay
   */
  static async createToyyibPayPayment(
    request: CreatePaymentRequest
  ): Promise<PaymentResponse> {
    try {
      // Get ToyyibPay provider for the mosque
      const provider = await this.getPaymentProvider(request.mosqueId, 'toyyibpay');
           
      if (!provider || !provider.toyyibpay_secret_key || !provider.toyyibpay_category_code) {
        return {
          success: false,
          error: 'ToyyibPay not configured for this mosque',
        };
      }

      // Create ToyyibPay client
      const toyyibPayConfig: ToyyibPayConfig = {
        secretKey: provider.toyyibpay_secret_key,
        categoryCode: provider.toyyibpay_category_code,
        isSandbox: provider.is_sandbox,
      };

      const toyyibPay = new ToyyibPayProvider(toyyibPayConfig);

      // Generate callback and redirect URLs
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const callbackUrl = `${baseUrl}/api/webhooks/toyyibpay/callback?contribution_id=${request.contributionId}`;
      const redirectUrl = `${baseUrl}/api/webhooks/toyyibpay/redirect?contribution_id=${request.contributionId}`;

      // Create bill
      // Truncate billName to 30 characters max (ToyyibPay requirement)
      const baseBillName = 'Contribution - ';
      const maxDescLength = 30 - baseBillName.length;
      const truncatedDesc = request.description.length > maxDescLength 
        ? request.description.substring(0, maxDescLength - 3) + '...'
        : request.description;
      
      const billData = {
        billName: `${baseBillName}${truncatedDesc}`,
        billDescription: request.description, // Keep full description here
        billAmount: ToyyibPayProvider.toSen(request.amount), // Convert to sen
        billReturnUrl: redirectUrl,
        billCallbackUrl: callbackUrl,
        billExternalReferenceNo: request.contributionId,
        billTo: request.payerName,
        billEmail: request.payerEmail || '',
        billPhone: request.payerMobile || '',
        billContentEmail: `Payment for ${request.description}`,
      };

      const billResponse = await toyyibPay.createBill(billData);

      if (!billResponse || billResponse.length === 0) {
        return {
          success: false,
          error: 'Failed to create ToyyibPay bill',
        };
      }

      const bill = billResponse[0];
      
      // Construct payment URL manually since API only returns BillCode
      const paymentUrl = toyyibPay.constructPaymentUrl(bill.BillCode);
      
      // Prepare initial payment data for additional info
      const paymentData = {
        provider: 'toyyibpay',
        toyyibpay_bill_code: bill.BillCode,
        category_code: provider.toyyibpay_category_code,
        bill_external_reference_no: billData.billExternalReferenceNo || null,
        bill_name: billData.billName,
        bill_description: billData.billDescription,
        bill_amount: billData.billAmount.toString(),
        bill_date: new Date().toISOString(),
        bill_url: paymentUrl,
        created_at: new Date().toISOString(),
        callback_url: callbackUrl,
        redirect_url: redirectUrl
      };
            
      const { data: updatedContribution, error: updateError } = await getSupabaseAdmin()
        .from('khairat_contributions')
        .update({
          payment_method: 'toyyibpay',
          bill_id: bill.BillCode,
          payment_data: paymentData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.contributionId)
        .select()
        .single();
        
      if (updateError) {
        console.error('❌ Database update failed:', updateError);
        return { success: false, error: `Database update failed: ${updateError.message}` };
      }
        
      return {
        success: true,
        paymentId: bill.BillCode,
        paymentUrl: paymentUrl,
      };
    } catch (error) {
      console.error('Error creating ToyyibPay payment:', error);
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
    contributionId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {

      const billId = callbackData.id as string;
      
      if (!billId) {
        return { success: false, error: 'Missing bill ID' };
      }
      
      if (!contributionId) {
        return { success: false, error: 'Missing contribution ID' };
      }
      

      
      // Compound key lookup using both contribution_id and bill_id for enhanced security
      const { data: contribution, error: contributionError } = await getSupabaseAdmin()
        .from('khairat_contributions')
        .select('*')
        .eq('id', contributionId)
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

      console.log('✅ Processing Billplz callback without signature verification');
      console.log('callbackData', callbackData)

      // Update contribution status based on payment status
      const isPaid = callbackData.paid === true || callbackData.paid === 'true';
      const status = isPaid ? 'completed' : 'failed';
      
      // Store complete raw callback data from Billplz without any modifications
      const existingPaymentData = contribution.payment_data || {};
      const paymentData = {
        ...existingPaymentData, // Keep original data like callback_url, redirect_url, created_at
        ...callbackData, // Store complete raw callback data from Billplz
        callback_processed_at: new Date().toISOString()
      };

      const { data: updatedContribution, error: updateError } = await getSupabaseAdmin()
        .from('khairat_contributions')
        .update({
          status,
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
   * Process ToyyibPay callback
   */
  static async processToyyibPayCallback(
    callbackData: ToyyibPayCallbackData,
    contributionId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
     
      const billCode = callbackData.billcode;
      
      if (!billCode) {
        console.error('❌ Missing bill code in callback data');
        return { success: false, error: 'Missing bill code' };
      }
      
      if (!contributionId) {
        console.error('❌ Missing contribution ID');
        return { success: false, error: 'Missing contribution ID' };
      }
      
      // Compound key lookup using both contribution_id and bill_id for enhanced security
      console.log('🔍 Looking up contribution by compound key - ID:', contributionId, 'Bill Code:', billCode);
      const { data: contribution, error: contributionError } = await getSupabaseAdmin()
        .from('khairat_contributions')
        .select('*')
        .eq('id', contributionId)
        .eq('bill_id', billCode)
        .single();

      if (contributionError) {
        console.error('❌ Database error finding contribution:', contributionError);
        return { success: false, error: `Contribution lookup failed: ${contributionError.message}` };
      }
      
      if (!contribution) {
        console.error('❌ No contribution found for bill code:', billCode);
        return { success: false, error: 'Contribution not found' };
      }
      

      console.log('✅ Found contribution:', {
        id: contribution.id,
        current_status: contribution.status,
        current_amount: contribution.amount
      });

      // Update contribution status based on payment status
      const isPaid = callbackData.status_id === '1'; // 1 = successful payment
      const status = isPaid ? 'completed' : 'failed';
      
      console.log('💰 Payment details:', {
        status_id: callbackData.status_id,
        isPaid,
        status,
        amount: callbackData.amount,
        contribution_id: contribution.id,
        original_amount: contribution.amount
      });

      // Store complete raw callback data from ToyyibPay
      const existingPaymentData = contribution.payment_data || {};
      const paymentData = {
        ...existingPaymentData, // Keep original data like callback_url, redirect_url, created_at
        ...callbackData, // Store complete raw callback data from ToyyibPay
        callback_processed_at: new Date().toISOString()
      };

     const { data: updatedContribution, error: updateError } = await getSupabaseAdmin()
        .from('khairat_contributions')
        .update({
          status,
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
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error processing ToyyibPay callback:', error);
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

      if (providerType === 'toyyibpay') {
        const provider = await this.getPaymentProvider(mosqueId, 'toyyibpay');
        
        if (!provider || !provider.toyyibpay_secret_key || !provider.toyyibpay_category_code) {
          return { success: false, error: 'ToyyibPay provider not found or not configured' };
        }

        const toyyibPayConfig: ToyyibPayConfig = {
          secretKey: provider.toyyibpay_secret_key,
          categoryCode: provider.toyyibpay_category_code,
          isSandbox: provider.is_sandbox,
        };

        const toyyibPay = new ToyyibPayProvider(toyyibPayConfig);
        const bill = await toyyibPay.getBill(paymentId);

        if (!bill || bill.length === 0) {
          return { success: false, error: 'Bill not found' };
        }

        const billData = bill[0];
        return {
          success: true,
          status: billData.BillPaymentStatus === '1' ? 'completed' : 'pending',
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