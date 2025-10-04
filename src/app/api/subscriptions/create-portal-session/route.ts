import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    const { mosqueId } = await request.json();

    if (!mosqueId) {
      return NextResponse.json(
        { error: 'Missing mosque ID' },
        { status: 400 }
      );
    }

    // Get subscription with customer ID
    const { data: subscription, error: subscriptionError } = await supabase
      .from('mosque_subscriptions')
      .select('stripe_customer_id')
      .eq('mosque_id', mosqueId)
      .single();

    if (subscriptionError || !subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

