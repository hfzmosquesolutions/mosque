# Stripe Subscription Setup Guide

This guide will help you set up Stripe subscriptions for your mosque management app.

## 1. Stripe Account Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Complete the account verification process
3. Get your API keys from the Stripe Dashboard

## 2. Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs (create these in your Stripe dashboard)
STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id
STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_price_id

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. Create Products and Prices in Stripe

### Premium Plan (RM 99/month)
1. Go to Products in your Stripe Dashboard
2. Create a new product:
   - Name: "Mosque Management Premium"
   - Description: "Premium features for mosque management"
3. Add a recurring price:
   - Price: RM 99.00
   - Billing period: Monthly
   - Currency: MYR
4. Copy the Price ID and add it to `STRIPE_PREMIUM_PRICE_ID`

### Enterprise Plan (RM 299/month)
1. Create another product:
   - Name: "Mosque Management Enterprise"
   - Description: "Enterprise features for large organizations"
2. Add a recurring price:
   - Price: RM 299.00
   - Billing period: Monthly
   - Currency: MYR
3. Copy the Price ID and add it to `STRIPE_ENTERPRISE_PRICE_ID`

## 4. Webhook Setup

1. Go to Webhooks in your Stripe Dashboard
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret and add it to `STRIPE_WEBHOOK_SECRET`

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
- Basic events (5/month)
- Basic announcements
- Community member registration
- Basic donation tracking

### Premium Tier (RM 99/month)
- Everything in Free
- Khairat management
- Advanced kariah management
- Unlimited events
- Advanced financial reports
- Payment processing
- Priority support

### Enterprise Tier (RM 299/month)
- Everything in Premium
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
  requiredPlan="premium"
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

