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

    const { mosqueId, userId } = await request.json();

    if (!mosqueId && !userId) {
      return NextResponse.json(
        { error: 'Missing identifier' },
        { status: 400 }
      );
    }

    // Resolve stripe customer id (prefer user_subscriptions)
    let customerId: string | null = null;
    if (userId) {
      const { data: userSub } = await supabase
        .from('user_subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();
      if (userSub?.stripe_customer_id) customerId = userSub.stripe_customer_id;
    }
    if (!customerId && mosqueId) {
      const { data: mosqueSub } = await supabase
        .from('mosque_subscriptions')
        .select('stripe_customer_id')
        .eq('mosque_id', mosqueId)
        .single();
      if (mosqueSub?.stripe_customer_id) customerId = mosqueSub.stripe_customer_id;
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
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

