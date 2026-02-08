import Stripe from 'stripe';

// Only initialize Stripe on server side
let stripe: Stripe | null = null;

if (typeof window === 'undefined' && process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-09-30.clover',
    typescript: true,
  });
} else if (typeof window === 'undefined' && !process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not set. Stripe functionality will be limited.');
}

export { stripe };

export const STRIPE_CONFIG = {
  currency: 'myr',
  plans: {
    free: {
      price: 0,
      price_yearly: 0,
      limits: {
        events_per_month: 0,
        members: 50
      }
    },
    standard: {
      price: 7900, // RM 79.00 in cents (monthly)
      price_yearly: 75840, // RM 758.40 in cents (yearly, 20% discount: 79 * 12 * 0.8 = 758.4)
      stripe_price_id: process.env.STRIPE_STANDARD_PRICE_ID,
      stripe_price_id_yearly: process.env.STRIPE_STANDARD_PRICE_ID_YEARLY,
      limits: {
        events_per_month: 0,
        members: 500
      }
    },
    pro: {
      price: 39900, // RM 399.00 in cents (monthly)
      price_yearly: 383040, // RM 3,830.40 in cents (yearly, 20% discount: 399 * 12 * 0.8 = 3830.4)
      stripe_price_id: process.env.STRIPE_PRO_PRICE_ID,
      stripe_price_id_yearly: process.env.STRIPE_PRO_PRICE_ID_YEARLY,
      limits: {
        events_per_month: 0,
        members: -1,
        mosques: -1
      }
    }
  }
};

export type SubscriptionPlan = keyof typeof STRIPE_CONFIG.plans;
export type SubscriptionStatus = 'active' | 'inactive' | 'past_due' | 'canceled' | 'unpaid' | 'trialing';

export interface SubscriptionFeatures {
  khairat_management: boolean;
  advanced_kariah: boolean;
  unlimited_events: boolean;
  financial_reports: boolean;
  multi_mosque: boolean;
  api_access: boolean;
  custom_branding: boolean;
}

