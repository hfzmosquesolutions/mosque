import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase';
import Stripe from 'stripe';

const supabase = createClient();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    // Check if we've already processed this event
    const { data: existingEvent } = await supabase
      .from('subscription_webhook_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .single();

    if (existingEvent) {
      return NextResponse.json({ received: true });
    }

    // Store the event
    await supabase
      .from('subscription_webhook_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        data: event.data.object
      });

    // Process the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = (session.metadata as any)?.user_id || undefined;
  const plan = session.metadata?.plan;

  if (!plan) {
    console.error('Missing plan in checkout session');
    return;
  }

  if (userId) {
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'active',
        external_subscription_id: session.subscription as string,
        stripe_subscription_id: session.subscription as string,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('user_id', userId);
    return;
  }

  // No mosque fallback; mosque tables are deprecated
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = (subscription.metadata as any)?.user_id || undefined;
  const plan = subscription.metadata?.plan;

  if (!plan) {
    console.error('Missing plan in subscription');
    return;
  }

  const updatePayload = {
    external_subscription_id: subscription.id,
    stripe_subscription_id: subscription.id,
    plan: plan as any,
    status: subscription.status as any,
    current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
    current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
  } as any;

  if (userId) {
    await supabase
      .from('user_subscriptions')
      .update(updatePayload)
      .eq('user_id', userId);
    return;
  }

  // No mosque fallback; mosque tables are deprecated
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = (subscription.metadata as any)?.user_id || undefined;

  const updatePayload = {
    status: subscription.status as any,
    current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
    current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
  } as any;

  if (userId) {
    await supabase
      .from('user_subscriptions')
      .update(updatePayload)
      .eq('user_id', userId);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = (subscription.metadata as any)?.user_id || undefined;
  const updatePayload = { status: 'canceled', canceled_at: new Date().toISOString() } as any;
  if (userId) {
    await supabase
      .from('user_subscriptions')
      .update(updatePayload)
      .eq('user_id', userId);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string;
  
  if (!subscriptionId) {
    return;
  }

  // Resolve owner of subscription for invoices; try user_subscriptions first
  const { data: userSub } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (userSub?.user_id) {
    await supabase
      .from('user_subscription_invoices')
      .insert({
        user_id: userSub.user_id,
        provider: 'stripe',
        external_invoice_id: invoice.id,
        stripe_invoice_id: invoice.id,
        amount_paid: invoice.amount_paid || 0,
        currency: invoice.currency || 'myr',
        status: invoice.status || 'paid',
        invoice_url: invoice.invoice_pdf || undefined,
        hosted_invoice_url: invoice.hosted_invoice_url || undefined
      });
    await supabase
      .from('user_subscriptions')
      .update({ status: 'active' })
      .eq('user_id', userSub.user_id);
    return;
  }

  // If not tied to user subscription, ignore (deprecated mosque flow removed)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string;
  
  if (!subscriptionId) {
    return;
  }

  // Update subscription status
  await supabase
    .from('mosque_subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', subscriptionId);
}

