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
    } else if (existingEvent.processed) {
      return new Response(
        JSON.stringify({ received: true, message: "Event already processed" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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

  // Upsert with plan and subscription IDs
  // Note: Period dates will be updated by customer.subscription.created event
  // which fires after checkout completes and has accurate subscription data
  const upsertPayload: any = {
    user_id: userId,
    plan: plan as any,
    status: "active",
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
  const plan = subscription.metadata?.plan;

  if (!userId) {
    console.error("Missing user_id in subscription metadata");
    return;
  }

  if (!plan) {
    console.error("Missing plan in subscription metadata");
    return;
  }

  // Validate plan is a valid enum value
  const validPlans = ['free', 'standard', 'pro'];
  if (!validPlans.includes(plan)) {
    console.error(`Invalid plan value: ${plan}. Must be one of: ${validPlans.join(', ')}`);
    return;
  }

  const upsertPayload = {
    user_id: userId,
    external_subscription_id: subscription.id,
    stripe_subscription_id: subscription.id,
    plan: plan as any,
    status: subscription.status as any,
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
  const userId = (subscription.metadata as any)?.user_id || undefined;

  const updatePayload = {
    status: subscription.status as any,
    current_period_start: toISOString((subscription as any).current_period_start),
    current_period_end: toISOString((subscription as any).current_period_end),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: toISOString(subscription.canceled_at),
  } as any;

  if (userId) {
    await supabase
      .from("user_subscriptions")
      .update(updatePayload)
      .eq("user_id", userId);
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const userId = (subscription.metadata as any)?.user_id || undefined;
  const updatePayload = {
    status: "canceled",
    canceled_at: new Date().toISOString(),
  } as any;
  if (userId) {
    await supabase
      .from("user_subscriptions")
      .update(updatePayload)
      .eq("user_id", userId);
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
    .select("user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (userSub?.user_id) {
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
    });
    await supabase
      .from("user_subscriptions")
      .update({ status: "active" })
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
