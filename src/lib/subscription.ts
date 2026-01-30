import { supabase, createClient } from '@/lib/supabase';
import { STRIPE_CONFIG, SubscriptionPlan, SubscriptionStatus, SubscriptionFeatures } from '@/lib/stripe';

// Use the regular supabase client for client-side operations
// The createClient() function is only used in API routes

export interface MosqueSubscription {
  id: string;
  mosque_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  trial_start?: string;
  trial_end?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionUsage {
  id: string;
  mosque_id: string;
  feature_name: string;
  usage_count: number;
  limit_count?: number;
  reset_period: string;
  last_reset: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionInvoice {
  id: string;
  mosque_id: string;
  stripe_invoice_id: string;
  amount_paid: number;
  currency: string;
  status: string;
  invoice_url?: string;
  hosted_invoice_url?: string;
  created_at: string;
}

// User-linked subscription types and helpers (new)
export interface UserSubscription {
  id: string;
  user_id: string;
  provider?: string;
  external_customer_id?: string;
  stripe_customer_id?: string;
  external_subscription_id?: string;
  stripe_subscription_id?: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billing_period?: 'monthly' | 'yearly' | 'annual';
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  trial_start?: string;
  trial_end?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSubscriptionInvoice {
  id: string;
  user_id: string;
  provider?: string;
  external_invoice_id?: string;
  stripe_invoice_id: string;
  amount_paid: number;
  currency: string;
  status: string;
  invoice_url?: string;
  hosted_invoice_url?: string;
  created_at: string;
}

export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }

  return data as unknown as UserSubscription;
}

export async function updateUserSubscription(
  userId: string,
  updates: Partial<UserSubscription>
): Promise<boolean> {
  const { error } = await supabase
    .from('user_subscriptions')
    .update(updates)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating user subscription:', error);
    return false;
  }

  return true;
}

export async function getUserSubscriptionInvoices(userId: string): Promise<UserSubscriptionInvoice[]> {
  const { data, error } = await supabase
    .from('user_subscription_invoices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user subscription invoices:', error);
    return [];
  }

  return (data || []) as unknown as UserSubscriptionInvoice[];
}

export async function getMosqueSubscription(mosqueId: string): Promise<MosqueSubscription | null> {
  const { data, error } = await supabase
    .from('mosque_subscriptions')
    .select('*')
    .eq('mosque_id', mosqueId)
    .single();

  if (error) {
    console.error('Error fetching mosque subscription:', error);
    return null;
  }

  return data;
}

export async function getEffectiveSubscription(mosqueId: string): Promise<MosqueSubscription | UserSubscription | null> {
  // First check if mosque has an owner with a user subscription
  const { data: mosque } = await supabase
    .from('mosques')
    .select('user_id')
    .eq('id', mosqueId)
    .single();

  if (mosque?.user_id) {
    const userSub = await getUserSubscription(mosque.user_id);
    if (userSub && (userSub.status === 'active' || userSub.status === 'trialing')) {
      return userSub;
    }
  }

  // Fallback to mosque subscription
  return getMosqueSubscription(mosqueId);
}

export async function updateMosqueSubscription(
  mosqueId: string,
  updates: Partial<MosqueSubscription>
): Promise<boolean> {
  const { error } = await supabase
    .from('mosque_subscriptions')
    .update(updates)
    .eq('mosque_id', mosqueId);

  if (error) {
    console.error('Error updating mosque subscription:', error);
    return false;
  }

  return true;
}

export async function createMosqueSubscription(
  mosqueId: string,
  subscriptionData: Partial<MosqueSubscription>
): Promise<boolean> {
  const { error } = await supabase
    .from('mosque_subscriptions')
    .insert({
      mosque_id: mosqueId,
      ...subscriptionData
    });

  if (error) {
    console.error('Error creating mosque subscription:', error);
    return false;
  }

  return true;
}

export async function getSubscriptionUsage(mosqueId: string): Promise<SubscriptionUsage[]> {
  const { data, error } = await supabase
    .from('subscription_usage')
    .select('*')
    .eq('mosque_id', mosqueId);

  if (error) {
    console.error('Error fetching subscription usage:', error);
    return [];
  }

  return data || [];
}

export async function getSubscriptionInvoices(mosqueId: string): Promise<SubscriptionInvoice[]> {
  const { data, error } = await supabase
    .from('subscription_invoices')
    .select('*')
    .eq('mosque_id', mosqueId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching subscription invoices:', error);
    return [];
  }

  return data || [];
}

export async function isFeatureAvailable(mosqueId: string, featureName: string): Promise<boolean> {
  // First, check if the mosque owner has a subscription that covers this feature
  const { data: mosque } = await supabase
    .from('mosques')
    .select('user_id')
    .eq('id', mosqueId)
    .single();

  if (mosque?.user_id) {
    const userSub = await getUserSubscription(mosque.user_id);
    if (userSub && (userSub.status === 'active' || userSub.status === 'trialing')) {
      const features = getFeaturesForPlan(userSub.plan);
      // @ts-ignore - Index signature issue
      if (features[featureName]) return true;
    }
  }

  // Fallback to mosque-level subscription check via RPC
  const { data, error } = await supabase
    .rpc('is_feature_available', {
      mosque_uuid: mosqueId,
      feature_name: featureName
    });

  if (error) {
    console.error('Error checking feature availability:', error);
    return false;
  }

  return data || false;
}

export async function trackFeatureUsage(mosqueId: string, featureName: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('track_feature_usage', {
      mosque_uuid: mosqueId,
      feature_name: featureName
    });

  if (error) {
    console.error('Error tracking feature usage:', error);
    return false;
  }

  return data || false;
}

export function getFeaturesForPlan(plan: SubscriptionPlan): SubscriptionFeatures {
  return STRIPE_CONFIG.plans[plan] ? {
    khairat_management: plan !== 'free',
    advanced_kariah: plan !== 'free',
    unlimited_events: false,
    financial_reports: plan !== 'free',
    multi_mosque: plan === 'pro',
    api_access: plan === 'pro',
    custom_branding: plan === 'pro'
  } : {
    khairat_management: false,
    advanced_kariah: false,
    unlimited_events: false,
    financial_reports: false,
    multi_mosque: false,
    api_access: false,
    custom_branding: false
  };
}

export function getPlanLimits(plan: SubscriptionPlan) {
  return STRIPE_CONFIG.plans[plan]?.limits || {
    events_per_month: 0,
    announcements_per_month: 0,
    members: 50
  };
}

export function formatPrice(priceInCents: number): string {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2
  }).format(priceInCents / 100);
}

