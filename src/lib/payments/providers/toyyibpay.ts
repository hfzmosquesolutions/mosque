import crypto from 'crypto';

export interface ToyyibPayConfig {
  secretKey: string;
  categoryCode: string;
  isSandbox?: boolean;
}

export interface ToyyibPayBillData {
  userSecretKey: string;
  categoryCode: string;
  billName: string;
  billDescription: string;
  billPriceSetting: number;
  billPayorInfo: number;
  billAmount: number; // in sen (cents)
  billReturnUrl: string;
  billCallbackUrl: string;
  billExternalReferenceNo: string;
  billTo: string;
  billEmail: string;
  billPhone: string;
  billSplitPayment: number;
  billSplitPaymentArgs: string;
  billPaymentChannel: string;
  billContentEmail: string;
  billChargeToCustomer: number;
}

export interface ToyyibPayBillResponse {
  BillCode: string;
  BillpaymentStatus?: string;
  BillExternalReferenceNo?: string;
  BillTo?: string;
  BillEmail?: string;
  BillPhone?: string;
  BillName?: string;
  BillDescription?: string;
  BillAmount?: string;
  BillDate?: string;
  BillUrl?: string;
}

export interface ToyyibPayMinimalResponse {
  BillCode: string;
}

export interface ToyyibPayCallbackData {
  refno: string;
  status: string;
  reason: string;
  billcode: string;
  order_id: string;
  amount: string;
  transaction_id: string;
  fpx_transaction_id?: string;
  fpx_sellerOrderNo?: string;
  status_id: string;
  msg: string;
  hash: string;
}

export class ToyyibPayProvider {
  private config: ToyyibPayConfig;
  private baseUrl: string;

  constructor(config: ToyyibPayConfig) {
    this.config = config;
    this.baseUrl = config.isSandbox 
      ? 'https://dev.toyyibpay.com'
      : 'https://toyyibpay.com';
  }

  /**
   * Create a new bill in ToyyibPay
   */
  async createBill(billData: Partial<ToyyibPayBillData>): Promise<ToyyibPayMinimalResponse[]> {
    const url = `${this.baseUrl}/index.php/api/createBill`;
    
    const formData = new URLSearchParams();
    
    // Set required fields with defaults
    const billPayload = {
      userSecretKey: this.config.secretKey,
      categoryCode: this.config.categoryCode,
      billPriceSetting: 1, // Fixed price
      billPayorInfo: 1, // Required
      billSplitPayment: 0, // No split payment
      billSplitPaymentArgs: '',
      billPaymentChannel: '0', // FPX
      billChargeToCustomer: 1, // Charge to customer
      ...billData
    };

    Object.entries(billPayload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ToyyibPay API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    // Handle the minimal response from ToyyibPay API
    if (Array.isArray(result)) {
      return result;
    }
    
    // If it's a single object, wrap it in an array
    return [result];
  }

  /**
   * Get bill details by bill code
   */
  async getBill(billCode: string): Promise<any> {
    const url = `${this.baseUrl}/index.php/api/getBillTransactions`;
    
    const formData = new URLSearchParams();
    formData.append('billCode', billCode);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ToyyibPay API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Verify hash signature from ToyyibPay callback
   */
  verifyHash(data: ToyyibPayCallbackData): boolean {
    // ToyyibPay hash verification
    // Hash = MD5(secretkey + refno + amount + status)
    const hashString = `${this.config.secretKey}${data.refno}${data.amount}${data.status}`;
    const computedHash = crypto
      .createHash('md5')
      .update(hashString)
      .digest('hex');
    
    return computedHash === data.hash;
  }

  /**
   * Get bank list from ToyyibPay
   */
  async getBanks(): Promise<any[]> {
    const url = `${this.baseUrl}/index.php/api/getBank`;
    
    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ToyyibPay API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get user details (for testing connection)
   */
  async getUserDetails(): Promise<any> {
    const url = `${this.baseUrl}/index.php/api/getUserDetails`;
    
    const formData = new URLSearchParams();
    formData.append('userSecretKey', this.config.secretKey);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ToyyibPay API error: ${response.status} - ${errorText}`);
    }

    return response.json();
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
   * Construct payment URL from bill code
   */
  constructPaymentUrl(billCode: string): string {
    return `${this.baseUrl}/${billCode}`;
  }

  /**
   * Validate ToyyibPay configuration
   */
  static validateConfig(config: Partial<ToyyibPayConfig>): config is ToyyibPayConfig {
    return Boolean(
      config.secretKey &&
      config.categoryCode
    );
  }
}

/**
 * Factory function to create ToyyibPay provider instance
 */
export function createToyyibPayProvider(config: ToyyibPayConfig): ToyyibPayProvider {
  if (!ToyyibPayProvider.validateConfig(config)) {
    throw new Error('Invalid ToyyibPay configuration: missing required fields');
  }
  
  return new ToyyibPayProvider(config);
}

/**
 * Helper function to generate callback/redirect URLs
 */
export function generateToyyibPayUrls(baseUrl: string, mosqueId: string) {
  return {
    callbackUrl: `${baseUrl}/api/webhooks/toyyibpay/callback`,
    redirectUrl: `${baseUrl}/api/webhooks/toyyibpay/redirect?mosque_id=${mosqueId}`,
  };
}