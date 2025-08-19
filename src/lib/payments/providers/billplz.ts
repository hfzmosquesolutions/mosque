import crypto from 'crypto';

export interface BillplzConfig {
  apiKey: string;
  xSignatureKey: string;
  collectionId: string;
  isSandbox?: boolean;
}

export interface BillplzBillData {
  collection_id: string;
  email?: string;
  mobile?: string;
  name: string;
  amount: number; // in sen (cents)
  callback_url: string;
  description: string;
  due_at?: string;
  redirect_url?: string;
  reference_1_label?: string;
  reference_1?: string;
  reference_2_label?: string;
  reference_2?: string;
}

export interface BillplzBillResponse {
  id: string;
  collection_id: string;
  paid: boolean;
  state: 'overdue' | 'paid' | 'due';
  amount: number;
  paid_amount: number;
  due_at: string;
  email: string;
  mobile: string;
  name: string;
  url: string;
  reference_1_label: string;
  reference_1: string;
  reference_2_label: string;
  reference_2: string;
  redirect_url: string;
  callback_url: string;
  description: string;
}

export interface BillplzCallbackData {
  id: string;
  collection_id: string;
  paid: boolean;
  state: 'overdue' | 'paid' | 'due';
  amount: number;
  paid_amount: number;
  paid_at?: string;
  transaction_id?: string;
  transaction_status?: string;
  x_signature: string;
}

export class BillplzProvider {
  private config: BillplzConfig;
  private baseUrl: string;

  constructor(config: BillplzConfig) {
    this.config = config;
    this.baseUrl = config.isSandbox 
      ? 'https://www.billplz-sandbox.com/api/v3'
      : 'https://www.billplz.com/api/v3';
  }

  /**
   * Create a new bill in Billplz
   */
  async createBill(billData: BillplzBillData): Promise<BillplzBillResponse> {
    const url = `${this.baseUrl}/bills`;
    
    const formData = new URLSearchParams();
    Object.entries(billData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(this.config.apiKey + ':').toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Billplz API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get bill details by ID
   */
  async getBill(billId: string): Promise<BillplzBillResponse> {
    const url = `${this.baseUrl}/bills/${billId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(this.config.apiKey + ':').toString('base64')}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Billplz API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Verify X-Signature from Billplz callback
   */
  verifyXSignature(data: Record<string, unknown>, receivedSignature: string): boolean {
    // Remove x_signature from data for verification
    const { ...dataToVerify } = data;
    
    // Sort keys and create query string
    const sortedKeys = Object.keys(dataToVerify).sort();
    const queryString = sortedKeys
      .map(key => `${key}${dataToVerify[key]}`)
      .join('|');
    
    // Create HMAC SHA256 signature
    const computedSignature = crypto
      .createHmac('sha256', this.config.xSignatureKey)
      .update(queryString)
      .digest('hex');
    
    return computedSignature === receivedSignature;
  }

  /**
   * Get FPX banks list
   */
  async getFpxBanks(): Promise<Record<string, unknown>> {
    const url = `${this.baseUrl}/fpx_banks`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(this.config.apiKey + ':').toString('base64')}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Billplz API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get collection information (for testing connection)
   */
  async getCollection(): Promise<Record<string, unknown>> {
    const url = `${this.baseUrl}/collections/${this.config.collectionId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(this.config.apiKey + ':').toString('base64')}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Billplz API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Delete a bill (only works for unpaid bills)
   */
  async deleteBill(billId: string): Promise<void> {
    const url = `${this.baseUrl}/bills/${billId}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${Buffer.from(this.config.apiKey + ':').toString('base64')}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Billplz API error: ${response.status} - ${errorText}`);
    }
  }

  /**
   * Convert amount from MYR to sen (cents)
   */
  static toSen(amountInMyr: number): number {
    return Math.round(amountInMyr * 100);
  }

  /**
   * Convert amount from sen (cents) to MYR
   */
  static toMyr(amountInSen: number): number {
    return amountInSen / 100;
  }

  /**
   * Validate Billplz configuration
   */
  static validateConfig(config: Partial<BillplzConfig>): config is BillplzConfig {
    return Boolean(
      config.apiKey &&
      config.xSignatureKey &&
      config.collectionId
    );
  }
}

/**
 * Factory function to create Billplz provider instance
 */
export function createBillplzProvider(config: BillplzConfig): BillplzProvider {
  if (!BillplzProvider.validateConfig(config)) {
    throw new Error('Invalid Billplz configuration: missing required fields');
  }
  
  return new BillplzProvider(config);
}

/**
 * Helper function to generate callback/redirect URLs
 */
export function generateBillplzUrls(baseUrl: string, mosqueId: string) {
  return {
    callbackUrl: `${baseUrl}/api/webhooks/billplz/callback`,
    redirectUrl: `${baseUrl}/api/webhooks/billplz/redirect?mosque_id=${mosqueId}`,
  };
}