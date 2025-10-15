import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase';
import { STRIPE_CONFIG } from '@/lib/stripe';

const supabase = createClient();

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    const { mosqueId, userId, plan, adminEmail: providedAdminEmail, adminName: providedAdminName } = await request.json();

    if ((!mosqueId && !userId) || !plan) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!STRIPE_CONFIG.plans[plan as keyof typeof STRIPE_CONFIG.plans]) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Determine billing user id from input or mosque ownership
    let billingUserId: string | undefined = userId;
    if (!billingUserId && mosqueId) {
      const { data: mosque, error: mosqueError } = await supabase
        .from('mosques')
        .select('user_id')
        .eq('id', mosqueId)
        .single();
      if (mosqueError || !mosque?.user_id) {
        return NextResponse.json(
          { error: 'Unable to resolve billing user' },
          { status: 404 }
        );
      }
      billingUserId = (mosque as any).user_id as string;
    }

    // Resolve admin user's email and name from request (required)
    let adminEmail: string | undefined = providedAdminEmail;
    let adminName: string | undefined = providedAdminName;

    if (!adminEmail) {
      return NextResponse.json(
        { error: 'Admin user email is required for billing' },
        { status: 400 }
      );
    }

    // If name not provided, try to derive from user profile, otherwise fallback to email prefix
    if (!adminName && billingUserId) {
      const { data: ownerProfile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', billingUserId)
        .single();
      adminName = (ownerProfile as any)?.full_name || adminEmail.split('@')[0];
    }
    if (!adminName) {
      adminName = adminEmail.split('@')[0];
    }

    // Get or create Stripe customer (prefer user_subscriptions first, fallback to mosque_subscriptions)
    let customerId: string;
    let existingCustomerId: string | null = null;
    if (billingUserId) {
      const { data: userSub } = await supabase
        .from('user_subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', billingUserId)
        .single();
      if (userSub?.stripe_customer_id) existingCustomerId = userSub.stripe_customer_id;
    }
    if (!existingCustomerId && mosqueId) {
      const { data: mosqueSub } = await supabase
        .from('mosque_subscriptions')
        .select('stripe_customer_id')
        .eq('mosque_id', mosqueId)
        .single();
      if (mosqueSub?.stripe_customer_id) existingCustomerId = mosqueSub.stripe_customer_id;
    }

    if (existingCustomerId) {
      customerId = existingCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: adminEmail,
        name: adminName,
        metadata: {
          user_id: billingUserId || '',
          mosque_id: mosqueId || ''
        }
      });
      customerId = customer.id;

      // Upsert user_subscriptions with customer ID for billing user
      if (billingUserId) {
        const { data: existingUserSub } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('user_id', billingUserId)
          .single();
        if (existingUserSub) {
          await supabase
            .from('user_subscriptions')
            .update({
              provider: 'stripe',
              external_customer_id: customerId,
              stripe_customer_id: customerId
            })
            .eq('user_id', billingUserId);
        } else {
          await supabase
            .from('user_subscriptions')
            .insert({
              user_id: billingUserId,
              provider: 'stripe',
              external_customer_id: customerId,
              stripe_customer_id: customerId,
              plan: 'free',
              status: 'active'
            });
        }
      }
    }

    // Create checkout session
    const planConfig = STRIPE_CONFIG.plans[plan as keyof typeof STRIPE_CONFIG.plans];
    const priceId = 'stripe_price_id' in planConfig ? planConfig.stripe_price_id : undefined;
    
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID not configured for this plan' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      metadata: {
        user_id: billingUserId || '',
        mosque_id: mosqueId || '',
        plan: plan
      },
      subscription_data: {
        metadata: {
          user_id: billingUserId || '',
          mosque_id: mosqueId || '',
          plan: plan
        }
      }
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

