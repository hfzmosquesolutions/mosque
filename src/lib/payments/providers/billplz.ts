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
  state: 'overdue' | 'paid' | 'due' | 'deleted';
  amount: number;
  paid_amount: number;
  due_at: string;
  email: string;
  mobile: string;
  name: string;
  url: string;
  paid_at?: string;
  transaction_id?: string;
  transaction_status?: 'pending' | 'completed' | 'failed';
  reference_1_label?: string;
  reference_1?: string;
  reference_2_label?: string;
  reference_2?: string;
  redirect_url?: string;
  callback_url?: string;
  description?: string;
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
    const { x_signature, ...dataToVerify } = data;
    
    console.log('🔍 X-Signature Debug Info:');
    console.log('Original data:', data);
    console.log('Data to verify (without x_signature):', dataToVerify);
    console.log('Received signature:', receivedSignature);
    
    // Construct source string for verification (plain keys)
    const sortedKeys = Object.keys(dataToVerify).sort();
    
    // Try both encoded and non-encoded versions to see which one matches (plain keys)
    const queryStringRaw = sortedKeys
      .map(key => `${key}${dataToVerify[key]}`)
      .join('|');
    
    const queryStringEncoded = sortedKeys
      .map(key => `${key}${encodeURIComponent(String(dataToVerify[key]))}`)
      .join('|');

    // Additionally, Billplz Redirect X-Signature uses bracketed keys: billplz[id], billplz[paid], billplz[paid_at]
    // Build bracketed variants to support verification from redirect URLs
    const entries = Object.entries(dataToVerify).map(([k, v]) => [k, v] as const);
    const bracketedEntries = entries.map(([k, v]) => [`billplz[${k}]`, v] as const).sort(([a], [b]) => a.localeCompare(b));

    const queryStringBracketedRaw = bracketedEntries
      .map(([k, v]) => `${k}${v}`)
      .join('|');
    
    const queryStringBracketedEncoded = bracketedEntries
      .map(([k, v]) => `${k}${encodeURIComponent(String(v))}`)
      .join('|');

    console.log('🔍 X-Signature Debug Info:');
    console.log('Sorted keys (plain):', sortedKeys);
    console.log('Raw source string (plain):', queryStringRaw);
    console.log('URL encoded source string (plain):', queryStringEncoded);
    console.log('Bracketed entries keys:', bracketedEntries.map(([k]) => k));
    console.log('Raw source string (bracketed):', queryStringBracketedRaw);
    console.log('URL encoded source string (bracketed):', queryStringBracketedEncoded);
    console.log('X-Signature key (first 10 chars):', this.config.xSignatureKey.substring(0, 10) + '...');

    // Generate signatures for all variants
    const computedSignatureRaw = crypto
      .createHmac('sha256', this.config.xSignatureKey)
      .update(queryStringRaw)
      .digest('hex');
      
    const computedSignatureEncoded = crypto
      .createHmac('sha256', this.config.xSignatureKey)
      .update(queryStringEncoded)
      .digest('hex');

    const computedSignatureBracketedRaw = crypto
      .createHmac('sha256', this.config.xSignatureKey)
      .update(queryStringBracketedRaw)
      .digest('hex');

    const computedSignatureBracketedEncoded = crypto
      .createHmac('sha256', this.config.xSignatureKey)
      .update(queryStringBracketedEncoded)
      .digest('hex');

    console.log('Computed signature (plain/raw):', computedSignatureRaw);
    console.log('Computed signature (plain/encoded):', computedSignatureEncoded);
    console.log('Computed signature (bracketed/raw):', computedSignatureBracketedRaw);
    console.log('Computed signature (bracketed/encoded):', computedSignatureBracketedEncoded);
    console.log('Match (plain/raw):', computedSignatureRaw === receivedSignature);
    console.log('Match (plain/encoded):', computedSignatureEncoded === receivedSignature);
    console.log('Match (bracketed/raw):', computedSignatureBracketedRaw === receivedSignature);
    console.log('Match (bracketed/encoded):', computedSignatureBracketedEncoded === receivedSignature);
    
    // Check which version matches
    const isValid = (
      computedSignatureRaw === receivedSignature ||
      computedSignatureEncoded === receivedSignature ||
      computedSignatureBracketedRaw === receivedSignature ||
      computedSignatureBracketedEncoded === receivedSignature
    );
    
    return isValid;
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
export function generateBillplzUrls(baseUrl: string, mosqueId: string, contributionId?: string) {
  const callbackUrl = contributionId 
    ? `${baseUrl}/api/webhooks/billplz/callback?contribution_id=${contributionId}`
    : `${baseUrl}/api/webhooks/billplz/callback`;
  const redirectUrl = contributionId
    ? `${baseUrl}/api/webhooks/billplz/redirect?contribution_id=${contributionId}`
    : `${baseUrl}/api/webhooks/billplz/redirect?mosque_id=${mosqueId}`;
  
  return {
    callbackUrl,
    redirectUrl,
  };
}