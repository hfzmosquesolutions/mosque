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
      name: 'Free',
      price: 0,
      features: [
        'Basic mosque profile',
        'Community member registration'
      ],
      limits: {
        events_per_month: 0,
        members: 50
      }
    },
    standard: {
      name: 'Standard',
      price: 7900, // RM 79.00 in cents
      stripe_price_id: process.env.STRIPE_STANDARD_PRICE_ID,
      features: [
        'Everything in Free',
        'Khairat management',
        'Advanced kariah management',
        'Advanced financial reports',
        'Payment processing',
        'Priority support'
      ],
      limits: {
        events_per_month: 0,
        members: -1
      }
    },
    pro: {
      name: 'Pro',
      price: 39900, // RM 399.00 in cents
      stripe_price_id: process.env.STRIPE_PRO_PRICE_ID,
      features: [
        'Everything in Standard',
        'Multi-mosque support',
        'API access',
        'Custom integrations',
        'Advanced analytics',
        'White-label options',
        'Dedicated support'
      ],
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

export function getFeaturesForPlan(plan: SubscriptionPlan): SubscriptionFeatures {
  switch (plan) {
    case 'free':
      return {
        khairat_management: false,
        advanced_kariah: false,
        unlimited_events: false,
        financial_reports: false,
        multi_mosque: false,
        api_access: false,
        custom_branding: false
      };
    case 'standard':
      return {
        khairat_management: true,
        advanced_kariah: true,
        unlimited_events: true,
        financial_reports: true,
        multi_mosque: false,
        api_access: false,
        custom_branding: false
      };
    case 'pro':
      return {
        khairat_management: true,
        advanced_kariah: true,
        unlimited_events: true,
        financial_reports: true,
        multi_mosque: true,
        api_access: true,
        custom_branding: true
      };
    default:
      return getFeaturesForPlan('free');
  }
}

