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

    const { mosqueId, plan } = await request.json();

    if (!mosqueId || !plan) {
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

    // Get mosque details
    const { data: mosque, error: mosqueError } = await supabase
      .from('mosques')
      .select('id, name, email')
      .eq('id', mosqueId)
      .single();

    if (mosqueError || !mosque) {
      return NextResponse.json(
        { error: 'Mosque not found' },
        { status: 404 }
      );
    }

    // Get or create Stripe customer
    let customerId: string;
    const { data: subscription } = await supabase
      .from('mosque_subscriptions')
      .select('stripe_customer_id')
      .eq('mosque_id', mosqueId)
      .single();

    if (subscription?.stripe_customer_id) {
      customerId = subscription.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: mosque.email,
        name: mosque.name,
        metadata: {
          mosque_id: mosqueId
        }
      });
      customerId = customer.id;

      // Update subscription with customer ID
      await supabase
        .from('mosque_subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('mosque_id', mosqueId);
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
        mosque_id: mosqueId,
        plan: plan
      },
      subscription_data: {
        metadata: {
          mosque_id: mosqueId,
          plan: plan
        }
      }
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

