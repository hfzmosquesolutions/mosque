// Supabase Edge Function for Stripe Webhooks
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: "2024-12-18.acacia",
  httpClient: Stripe.createFetchHttpClient(),
}) : null;

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Helper function to safely convert Unix timestamp to ISO string
function toISOString(timestamp: number | null | undefined): string | null {
  if (!timestamp || isNaN(timestamp)) return null;
  try {
    return new Date(timestamp * 1000).toISOString();
  } catch (e) {
    console.error("Error converting timestamp to ISO:", timestamp, e);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Wrap everything in a promise to catch event loop errors
  try {
    return await (async () => {
      if (!stripe || !webhookSecret) {
        console.error("Stripe is not configured");
        return new Response(
          JSON.stringify({ error: "Stripe is not configured" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const body = await req.text();
      const signature = req.headers.get("stripe-signature");

      if (!signature) {
        console.error("Missing stripe-signature header");
        return new Response(
          JSON.stringify({ error: "Missing stripe-signature header" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      let event: Stripe.Event;

      try {
        // Use constructEventAsync for Deno/Edge Functions (async crypto API)
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        console.log(`Webhook event received: ${event.type} (${event.id})`);
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err?.message);
        return new Response(
          JSON.stringify({ 
            error: "Invalid signature",
            details: Deno.env.get("NODE_ENV") === "development" ? err?.message : undefined
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

    // Create Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if we've already processed this event
    const { data: existingEvent } = await supabaseClient
      .from("subscription_webhook_events")
      .select("id, processed")
      .eq("stripe_event_id", event.id)
      .single();

    // Critical events that should always be reprocessed (subscription state changes)
    const criticalEvents = [
      'customer.subscription.deleted',
      'customer.subscription.updated',
      'customer.subscription.created'
    ];
    const isCriticalEvent = criticalEvents.includes(event.type);

    // Store the event if it doesn't exist, or update processed flag
    if (!existingEvent) {
      const { error: insertError } = await supabaseClient.from("subscription_webhook_events").insert({
        stripe_event_id: event.id,
        event_type: event.type,
        data: event.data.object,
        processed: false,
      });
      
      if (insertError) {
        console.error("Error storing event:", insertError);
      }
    } else if (existingEvent.processed && !isCriticalEvent) {
      // Skip non-critical events that were already processed
      // But always reprocess critical subscription events to ensure state is correct
      return new Response(
        JSON.stringify({ received: true, message: "Event already processed" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (existingEvent.processed && isCriticalEvent) {
      // Reset processed flag for critical events to allow reprocessing
      console.log(`Reprocessing critical event: ${event.type} (${event.id})`);
      await supabaseClient
        .from("subscription_webhook_events")
        .update({ processed: false })
        .eq("stripe_event_id", event.id);
    }

    // Process the event
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
          supabaseClient
        );
        break;
      case "customer.subscription.created":
        await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription,
          supabaseClient
        );
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
          supabaseClient
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
          supabaseClient
        );
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice,
          supabaseClient
        );
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
          supabaseClient
        );
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

      // Mark event as processed after successful handling
      await supabaseClient
        .from("subscription_webhook_events")
        .update({ processed: true })
        .eq("stripe_event_id", event.id);

      return new Response(
        JSON.stringify({ received: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    })();
  } catch (error: any) {
    // Catch any event loop or other errors
    console.error("Error processing webhook:", error?.message || error);
    
    // Check if it's the Deno.core.runMicrotasks error - this is a known issue
    // but we can still return success since the webhook was likely processed
    if (error?.message?.includes("Deno.core.runMicrotasks") || 
        error?.message?.includes("runMicrotasks")) {
      // This is a known Deno/Stripe SDK compatibility issue
      // The webhook was likely processed successfully before this error
      return new Response(
        JSON.stringify({ received: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    return new Response(
      JSON.stringify({ 
        error: "Webhook processing failed",
        message: error?.message || "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  const userId = (session.metadata as any)?.user_id || undefined;
  const plan = session.metadata?.plan;
  const billing = session.metadata?.billing || 'monthly'; // Get billing period from metadata

  if (!plan) {
    console.error("Missing plan in checkout session metadata");
    return;
  }

  if (!userId) {
    console.error("Missing user_id in checkout session metadata");
    return;
  }

  // Validate plan is a valid enum value
  const validPlans = ['free', 'standard', 'pro'];
  if (!validPlans.includes(plan)) {
    console.error(`Invalid plan value: ${plan}. Must be one of: ${validPlans.join(', ')}`);
    return;
  }

  // Normalize billing period (annual -> yearly)
  const billingPeriod = billing === 'annual' ? 'yearly' : billing;

  // Upsert with plan and subscription IDs
  // Note: Period dates will be updated by customer.subscription.created event
  // which fires after checkout completes and has accurate subscription data
  const upsertPayload: any = {
    user_id: userId,
    plan: plan as any,
    status: "active",
    billing_period: billingPeriod,
    external_subscription_id: session.subscription as string,
    stripe_subscription_id: session.subscription as string,
    // Use temporary dates - will be updated by subscription.created event
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString(),
  };

  const { error, data } = await supabase
    .from("user_subscriptions")
    .upsert(upsertPayload, {
      onConflict: 'user_id',
      ignoreDuplicates: false
    })
    .select();

  if (error) {
    console.error("Error updating subscription after checkout:", error);
  } else {
    console.log(`Subscription updated: user ${userId} -> plan ${plan}`);
  }
}

async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const userId = (subscription.metadata as any)?.user_id || undefined;

  if (!userId) {
    console.error("Missing user_id in subscription metadata");
    return;
  }

  // Get price information from subscription
  const price = subscription.items?.data?.[0]?.price;
  const priceId = price?.id;
  const interval = price?.recurring?.interval;

  // Look up plan from database using price ID (consistent with handleSubscriptionUpdated)
  let plan: string | undefined = subscription.metadata?.plan;
  let billingPeriod: string | undefined = subscription.metadata?.billing;

  if (priceId) {
    // Try to find plan from database using price ID
    const { data: priceData } = await supabase
      .from("stripe_prices")
      .select("plan, billing_period")
      .eq("stripe_price_id", priceId)
      .eq("is_active", true)
      .single();
    
    if (priceData) {
      plan = priceData.plan;
      billingPeriod = priceData.billing_period;
    }
  }

  // Fallback to metadata if database lookup failed
  if (!plan) {
    plan = subscription.metadata?.plan;
  }

  if (!plan) {
    console.error("Missing plan - could not determine from database or metadata");
    return;
  }

  // Validate plan is a valid enum value
  const validPlans = ['free', 'standard', 'pro'];
  if (!validPlans.includes(plan)) {
    console.error(`Invalid plan value: ${plan}. Must be one of: ${validPlans.join(', ')}`);
    return;
  }

  // Get billing period from interval if not found
  if (!billingPeriod) {
    if (interval === 'year') {
      billingPeriod = 'yearly';
    } else if (interval === 'month') {
      billingPeriod = 'monthly';
    } else {
      billingPeriod = subscription.metadata?.billing || 'monthly';
    }
  }

  // Normalize billing period (annual -> yearly)
  if (billingPeriod === 'annual') {
    billingPeriod = 'yearly';
  }

  const upsertPayload = {
    user_id: userId,
    external_subscription_id: subscription.id,
    stripe_subscription_id: subscription.id,
    plan: plan as any,
    status: subscription.status as any,
    billing_period: billingPeriod,
    current_period_start: toISOString(subscription.current_period_start),
    current_period_end: toISOString(subscription.current_period_end),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: toISOString(subscription.canceled_at),
    trial_start: toISOString(subscription.trial_start),
    trial_end: toISOString(subscription.trial_end),
  } as any;

  const { error, data } = await supabase
    .from("user_subscriptions")
    .upsert(upsertPayload, {
      onConflict: 'user_id',
      ignoreDuplicates: false
    })
    .select();

  if (error) {
    console.error("Error updating subscription:", error);
  } else {
    console.log(`Subscription updated: user ${userId} -> plan ${plan} (${subscription.status})`);
  }
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  // Log what Stripe returns after subscription update
  console.log('Stripe subscription update response:', JSON.stringify(subscription, null, 2));

  // Always fetch the latest subscription from Stripe API to ensure we have up-to-date period dates
  // Webhook payloads can sometimes have stale data, especially during renewals
  let latestSubscription = subscription;
  if (stripe && subscription.id) {
    try {
      // Retrieve subscription with all necessary fields
      // Note: current_period_start and current_period_end are always included in the response
      latestSubscription = await stripe.subscriptions.retrieve(subscription.id, {
        expand: ['items.data.price.product']
      });
    } catch (error) {
      console.error('Error fetching latest subscription from Stripe, using webhook payload:', error);
      // Fallback to webhook payload if API call fails
      latestSubscription = subscription;
    }
  }

  const userId = (latestSubscription.metadata as any)?.user_id || undefined;
  
  // Get price information from subscription
  // NOTE: Discounts/coupons don't affect the price ID - Stripe maintains the original price
  // and applies discounts separately. So we can safely look up by price_id even if user has a discount.
  const price = latestSubscription.items?.data?.[0]?.price;
  const priceId = price?.id;
  const amount = price?.unit_amount || price?.amount || 0; // Original price amount (before discounts)
  const interval = price?.recurring?.interval;
  
  // Look up plan from database using price ID (no hardcoding)
  // This works even with discounts because the price_id doesn't change
  let plan: string | undefined = undefined;
  let billingPeriod: string | undefined = undefined;
  
  if (priceId) {
    // Try to find plan from database using price ID
    // Price ID remains the same even when discounts are applied
    const { data: priceData, error: priceError } = await supabase
      .from("stripe_prices")
      .select("plan, billing_period")
      .eq("stripe_price_id", priceId)
      .eq("is_active", true)
      .single();
    
    if (!priceError && priceData) {
      plan = priceData.plan;
      billingPeriod = priceData.billing_period;
    } else {
      // Fallback: Try to find by amount + interval if price ID not found
      // Note: This uses original price amount, not discounted amount
      if (amount > 0 && interval) {
        const { data: amountData } = await supabase
          .from("stripe_prices")
          .select("plan, billing_period")
          .eq("amount", amount)
          .eq("interval", interval)
          .eq("is_active", true)
          .single();
        
        if (amountData) {
          plan = amountData.plan;
          billingPeriod = amountData.billing_period;
        }
      }
    }
  }
  
  // Fallback to metadata if database lookup failed
  if (!plan) {
    plan = latestSubscription.metadata?.plan;
  }
  
  // Get billing period from interval if not found in database
  if (!billingPeriod) {
    if (interval === 'year') {
      billingPeriod = 'yearly';
    } else if (interval === 'month') {
      billingPeriod = 'monthly';
    } else {
      billingPeriod = latestSubscription.metadata?.billing;
    }
  }
  
  // Normalize billing period
  if (billingPeriod === 'annual') {
    billingPeriod = 'yearly';
  }
  
  // Update subscription metadata in Stripe to keep it in sync
  if (stripe && plan && (plan !== latestSubscription.metadata?.plan || billingPeriod !== latestSubscription.metadata?.billing)) {
    try {
      await stripe.subscriptions.update(latestSubscription.id, {
        metadata: {
          ...latestSubscription.metadata,
          plan: plan,
          billing: billingPeriod || 'monthly'
        }
      });
    } catch (error) {
      console.error('Error updating subscription metadata:', error);
    }
  }

  // Get period dates from the latest subscription (fetched from API)
  // This ensures we have the most up-to-date dates, especially after renewals
  let currentPeriodStart = latestSubscription.current_period_start;
  let currentPeriodEnd = latestSubscription.current_period_end;
  
  // Fallback to subscription items if not available on subscription object
  if (!currentPeriodStart && latestSubscription.items?.data?.[0]?.current_period_start) {
    currentPeriodStart = latestSubscription.items.data[0].current_period_start;
  }
  if (!currentPeriodEnd && latestSubscription.items?.data?.[0]?.current_period_end) {
    currentPeriodEnd = latestSubscription.items.data[0].current_period_end;
  }

  // Handle cancellation and reactivation:
  // - When user cancels: Stripe sets cancel_at (timestamp) and/or cancel_at_period_end = true
  // - When user reactivates: Stripe sets cancel_at = null, cancel_at_period_end = false, canceled_at = null
  const cancelAt = latestSubscription.cancel_at ? latestSubscription.cancel_at : null;
  
  // If subscription is already canceled, don't set cancel_at_period_end
  // If cancel_at matches current_period_end, treat it as cancel_at_period_end
  // Otherwise, if cancel_at is set, subscription will cancel at that specific time
  // Also check if cancel_at_period_end is explicitly true
  const willCancelAtPeriodEnd = latestSubscription.status === 'canceled' ? false :
    (latestSubscription.cancel_at_period_end === true || 
    (cancelAt !== null && currentPeriodEnd !== null && cancelAt === currentPeriodEnd));

  // Detect reactivation: subscription was canceled but is now active again
  const isReactivated = latestSubscription.status === 'active' && 
    !willCancelAtPeriodEnd && 
    cancelAt === null && 
    latestSubscription.canceled_at === null;


  const updatePayload: any = {
    status: latestSubscription.status as any,
    current_period_start: toISOString(currentPeriodStart),
    current_period_end: toISOString(currentPeriodEnd),
    cancel_at_period_end: willCancelAtPeriodEnd,
    canceled_at: toISOString(latestSubscription.canceled_at),
  };

  // If userId not in metadata, try to find it by stripe_subscription_id
  let finalUserId = userId;
  if (!finalUserId && latestSubscription.id) {
    const { data: existingSub } = await supabase
      .from("user_subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", latestSubscription.id)
      .single();
    
    if (existingSub?.user_id) {
      finalUserId = existingSub.user_id;
    }
  }

  // Update plan based on subscription status
  if (latestSubscription.status === 'canceled' || latestSubscription.status === 'unpaid') {
    // Subscription is fully canceled or unpaid - downgrade to free
    updatePayload.plan = 'free' as any;
  } else if (plan) {
    // Subscription is active (including reactivated subscriptions)
    // Restore plan from price lookup or metadata
    // Validate plan is a valid enum value
    const validPlans = ['free', 'standard', 'pro'];
    if (validPlans.includes(plan)) {
      updatePayload.plan = plan as any;
      
    }
  }

  // Update billing period if we extracted it
  if (billingPeriod) {
    updatePayload.billing_period = billingPeriod;
  }

  if (finalUserId) {
    const { error } = await supabase
      .from("user_subscriptions")
      .update(updatePayload)
      .eq("user_id", finalUserId);
    
    if (error) {
      console.error('Error updating subscription:', error);
    }
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const userId = (subscription.metadata as any)?.user_id || undefined;
  const updatePayload = {
    status: "canceled",
    plan: "free" as any,
    canceled_at: new Date().toISOString(),
    // Clear subscription IDs since subscription is deleted
    external_subscription_id: null,
    stripe_subscription_id: null,
  } as any;
  
  if (userId) {
    const { error } = await supabase
      .from("user_subscriptions")
      .update(updatePayload)
      .eq("user_id", userId);
    
    if (error) {
      console.error("Error updating subscription after deletion:", error);
    } else {
      console.log(`Subscription deleted: user ${userId} downgraded to free plan`);
    }
  }
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: any
) {
  const subscriptionId = (invoice as any).subscription as string;

  if (!subscriptionId) {
    return;
  }

  // Resolve owner of subscription for invoices; try user_subscriptions first
  const { data: userSub } = await supabase
    .from("user_subscriptions")
    .select("user_id, cancel_at_period_end, canceled_at, current_period_end")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (userSub?.user_id) {
    // Fetch latest subscription data from Stripe to get updated period dates
    // This is important for subscription renewals - the period dates change when subscription renews
    let subscription: Stripe.Subscription | null = null;
    let isCanceled = userSub.canceled_at !== null;
    let willCancelAtPeriodEnd = userSub.cancel_at_period_end === true;
    let periodEnd = userSub.current_period_end;
    let currentPeriodStart: number | null = null;
    let currentPeriodEnd: number | null = null;

    if (stripe) {
      try {
        subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ['items.data.price.product']
        });
        isCanceled = subscription.canceled_at !== null;
        
        // Check both cancel_at_period_end and cancel_at (scheduled cancellation)
        const cancelAt = subscription.cancel_at;
        currentPeriodEnd = subscription.current_period_end;
        currentPeriodStart = subscription.current_period_start;
        
        willCancelAtPeriodEnd = subscription.cancel_at_period_end === true ||
          (cancelAt !== null && currentPeriodEnd !== null && cancelAt === currentPeriodEnd);
        
        if (currentPeriodEnd) {
          periodEnd = new Date(currentPeriodEnd * 1000).toISOString();
        }
      } catch (error) {
        console.error('Error fetching subscription from Stripe:', error);
      }
    }

    const isFinalInvoice = isCanceled || willCancelAtPeriodEnd;
    
    // Generate cancellation notice if applicable
    let description: string | undefined = undefined;
    if (isFinalInvoice) {
      if (isCanceled) {
        description = "This is your final invoice. Your subscription has been canceled.";
      } else if (willCancelAtPeriodEnd) {
        const periodEndDate = periodEnd 
          ? new Date(periodEnd).toLocaleDateString()
          : 'the end of the current period';
        description = `This is your final invoice. Your subscription will be canceled on ${periodEndDate}.`;
      }
    }

    // Insert invoice record
    await supabase.from("user_subscription_invoices").insert({
      user_id: userSub.user_id,
      provider: "stripe",
      external_invoice_id: invoice.id,
      stripe_invoice_id: invoice.id,
      amount_paid: invoice.amount_paid || 0,
      currency: invoice.currency || "myr",
      status: invoice.status || "paid",
      invoice_url: invoice.invoice_pdf || undefined,
      hosted_invoice_url: invoice.hosted_invoice_url || undefined,
      description: description,
      is_final_invoice: isFinalInvoice,
    });

    // Update subscription with latest period dates (important for renewals)
    // When subscription renews, current_period_start and current_period_end are updated
    const subscriptionUpdate: any = {
      status: "active",
    };

    // Update period dates if we fetched them from Stripe
    if (subscription && currentPeriodStart && currentPeriodEnd) {
      subscriptionUpdate.current_period_start = toISOString(currentPeriodStart);
      subscriptionUpdate.current_period_end = toISOString(currentPeriodEnd);
      subscriptionUpdate.cancel_at_period_end = willCancelAtPeriodEnd;
      subscriptionUpdate.canceled_at = toISOString(subscription.canceled_at);
      
    }

    await supabase
      .from("user_subscriptions")
      .update(subscriptionUpdate)
      .eq("user_id", userSub.user_id);
    return;
  }
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: any
) {
  const subscriptionId = (invoice as any).subscription as string;

  if (!subscriptionId) {
    return;
  }

  // Update subscription status
  const { data: userSub } = await supabase
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (userSub?.user_id) {
    await supabase
      .from("user_subscriptions")
      .update({ status: "past_due" })
      .eq("user_id", userSub.user_id);
  }
}
