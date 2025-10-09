export interface PaymentGatewayStatus {
  hasActiveProvider: boolean;
  providers: string[];
  needsSetup: boolean;
}

/**
 * Check if a mosque has any active payment providers configured
 * Uses the same API endpoint as the settings page for consistency
 */
export async function checkMosquePaymentGateway(mosqueId: string): Promise<PaymentGatewayStatus> {
  try {
    const response = await fetch(
      `${window.location.origin}/api/admin/payment-providers?mosqueId=${mosqueId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch payment providers: ${response.status}`);
    }

    const data = await response.json();
    const providers: string[] = [];

    // Check for active providers with proper validation
    if (data.billplz && data.billplz.is_active && 
        data.billplz.billplz_api_key && data.billplz.billplz_collection_id) {
      providers.push('billplz');
    }

    if (data.toyyibpay && data.toyyibpay.is_active && 
        data.toyyibpay.toyyibpay_secret_key && data.toyyibpay.toyyibpay_category_code) {
      providers.push('toyyibpay');
    }

    if (data.chip && data.chip.is_active && 
        data.chip.chip_api_key && data.chip.chip_brand_id) {
      providers.push('chip');
    }

    if (data.stripe && data.stripe.is_active && 
        data.stripe.stripe_secret_key && data.stripe.stripe_publishable_key) {
      providers.push('stripe');
    }

    return {
      hasActiveProvider: providers.length > 0,
      providers,
      needsSetup: providers.length === 0,
    };
  } catch (error) {
    console.error('Error checking payment gateway status:', error);
    return {
      hasActiveProvider: false,
      providers: [],
      needsSetup: true,
    };
  }
}

/**
 * Get a user-friendly message about payment gateway setup
 */
export function getPaymentGatewaySetupMessage(hasActiveProvider: boolean, providers: string[]): {
  title: string;
  description: string;
  actionText: string;
} {
  if (hasActiveProvider) {
    return {
      title: 'Payment Gateway Ready',
      description: `Your mosque has ${providers.length} payment provider${providers.length > 1 ? 's' : ''} configured and ready to accept online payments.`,
      actionText: 'Continue',
    };
  }

  return {
    title: 'Payment Gateway Required',
    description: 'To accept online payments for your khairat programs, you need to set up a payment gateway first. This will allow members to contribute securely online.',
    actionText: 'Set Up Payment Gateway',
  };
}
