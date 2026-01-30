# Stripe Subscription Setup Guide

This guide will help you set up Stripe subscriptions for your mosque management app.

## 1. Stripe Account Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Complete the account verification process
3. Get your API keys from the Stripe Dashboard

## 2. Environment Variables

### Next.js Application (.env.local)

Add the following environment variables to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Stripe Price IDs (create these in your Stripe dashboard)
# Monthly prices
STRIPE_STANDARD_PRICE_ID=price_your_standard_monthly_price_id
STRIPE_PRO_PRICE_ID=price_your_pro_monthly_price_id

# Yearly prices (for discounted annual subscriptions)
STRIPE_STANDARD_PRICE_ID_YEARLY=price_your_standard_yearly_price_id
STRIPE_PRO_PRICE_ID_YEARLY=price_your_pro_yearly_price_id

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note:** `STRIPE_WEBHOOK_SECRET` is no longer needed in `.env.local` as webhooks are now handled by Supabase Edge Functions (see Webhook Setup section below).

## 3. Create Products and Prices in Stripe

### Standard Plan

#### Monthly Subscription (RM 79/month)
1. Go to Products in your Stripe Dashboard
2. Create a new product:
   - Name: "Mosque Management Standard"
   - Description: "Standard features for mosque management"
3. Add a recurring price:
   - Price: RM 79.00
   - Billing period: Monthly
   - Currency: MYR
4. Copy the Price ID and add it to `STRIPE_STANDARD_PRICE_ID`

#### Yearly Subscription (RM 758.40/year - Save 20%)
1. In the same product (or create a new one), add another recurring price:
   - Price: RM 758.40
   - Billing period: Yearly
   - Currency: MYR
2. Copy the Price ID and add it to `STRIPE_STANDARD_PRICE_ID_YEARLY`

### Pro Plan

#### Monthly Subscription (RM 399/month)
1. Create a new product:
   - Name: "Mosque Management Pro"
   - Description: "Pro features for large organizations"
2. Add a recurring price:
   - Price: RM 399.00
   - Billing period: Monthly
   - Currency: MYR
3. Copy the Price ID and add it to `STRIPE_PRO_PRICE_ID`

#### Yearly Subscription (RM 3,830.40/year - Save 20%)
1. In the same product (or create a new one), add another recurring price:
   - Price: RM 3,830.40
   - Billing period: Yearly
   - Currency: MYR
2. Copy the Price ID and add it to `STRIPE_PRO_PRICE_ID_YEARLY`

**Note:** Yearly prices offer approximately 20% discount compared to monthly billing (equivalent to paying for 10 months, getting 12 months).

## 4. Webhook Setup (Supabase Edge Function)

We use Supabase Edge Functions to handle Stripe webhooks, which is more secure and doesn't require exposing your Next.js API routes.

### Deploy the Edge Function

1. **Deploy the Stripe webhook function to Supabase:**
   ```bash
   # Make sure you're logged in to Supabase CLI
   supabase login
   
   # Link your project (if not already linked)
   supabase link --project-ref your-project-ref
   
   # Deploy the function
   supabase functions deploy stripe-webhook
   ```

2. **Set environment variables in Supabase:**
   - Go to your Supabase Dashboard → Project Settings → Edge Functions
   - Add these secrets:
     - `STRIPE_SECRET_KEY`: Your Stripe secret key (starts with `sk_`)
     - `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret (starts with `whsec_`)
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (found in Project Settings → API)

   Or use the CLI:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_your_secret_key
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   supabase secrets set SUPABASE_URL=https://your-project.supabase.co
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Disable JWT Verification for the Function:**
   
   **IMPORTANT**: Stripe webhooks don't send Supabase JWT tokens, so you must disable JWT verification.
   
   **Using Supabase Dashboard:**
   1. Go to Edge Functions in your Supabase Dashboard
   2. Click on `stripe-webhook` function
   3. Find "Verify JWT" toggle and turn it **OFF**
   4. Save changes
   
   **Using CLI (config file already created):**
   - The `supabase/functions/stripe-webhook/config.toml` file is already created with JWT verification disabled
   - Just redeploy the function:
     ```bash
     supabase functions deploy stripe-webhook
     ```
   
   **Security**: The function is still secure because:
   - Stripe webhook signature verification ensures requests are from Stripe
   - Only requests with valid Stripe signatures are processed
   - The webhook secret is stored securely in Supabase secrets

3. **Get your Edge Function URL:**
   - After deployment, your function will be available at:
     ```
     https://your-project-ref.supabase.co/functions/v1/stripe-webhook
     ```

### Configure Stripe Webhook

1. Go to Webhooks in your Stripe Dashboard
2. Click "Add endpoint"
3. Enter your Supabase Edge Function URL:
   ```
   https://your-project-ref.supabase.co/functions/v1/stripe-webhook
   ```
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. **IMPORTANT**: Copy the webhook signing secret (starts with `whsec_`) - this is shown only once!
7. Add it to Supabase secrets:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```
   
   **Troubleshooting "Invalid signature" error:**
   - Make sure the webhook secret in Supabase matches exactly the one in Stripe
   - The secret is shown only once when you create the webhook endpoint
   - If you lost it, you need to create a new webhook endpoint in Stripe
   - Verify the secret in Supabase Dashboard → Project Settings → Edge Functions → Secrets
   - The secret should start with `whsec_` and be about 32+ characters long

### Local Development

For local development, you can use Stripe CLI to forward webhooks:

```bash
# Install Stripe CLI if you haven't already
# Then forward webhooks to your local Supabase function
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

This will give you a webhook signing secret for local testing (starts with `whsec_`).

## 5. Database Migration

Run the subscription migration:

```bash
# If using Supabase CLI
supabase db push

# Or run the migration file directly
psql -h your-db-host -U your-username -d your-database -f supabase/migrations/20250202000010_add_subscription_system.sql
```

## 6. Testing

### Test Mode
- Use test API keys (starting with `sk_test_` and `pk_test_`)
- Test with Stripe test cards:
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`

### Live Mode
- Switch to live API keys (starting with `sk_live_` and `pk_live_`)
- Update webhook endpoint to production URL
- Test with real payment methods

## 7. Subscription Features

### Free Tier
- Basic mosque profile
- Community member registration
- Basic khairat overview

### Standard Tier (RM 79/month or RM 758.40/year)
- Everything in Free
- Khairat management
- Advanced kariah management
- Advanced financial reports
- Payment processing
- Priority support

### Pro Tier (RM 399/month or RM 3,830.40/year)
- Everything in Standard
- Multi-mosque support
- API access
- Custom integrations
- Advanced analytics
- White-label options
- Dedicated support

## 8. Feature Gating

The app uses feature gates to control access to premium features:

```tsx
import { FeatureGate } from '@/components/subscription/FeatureGate';

<FeatureGate
  mosqueId={mosqueId}
  featureName="khairat_management"
  requiredPlan="standard"
  onUpgrade={() => window.location.href = '/billing'}
>
  {/* Premium content */}
</FeatureGate>
```

## 9. Monitoring

Monitor your subscriptions in:
- Stripe Dashboard
- App's billing page (`/billing`)
- Database tables: `mosque_subscriptions`, `subscription_invoices`

## 10. Troubleshooting

### Common Issues
1. **Webhook not receiving events**: Check endpoint URL and webhook secret
2. **Price ID not found**: Verify price IDs in Stripe Dashboard
3. **Feature gates not working**: Check subscription status in database
4. **Payment failures**: Check Stripe logs and customer payment methods

### Support
- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com

