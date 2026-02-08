# Pricing System Documentation

This document explains how the pricing system works in the mosque management application, including how prices are managed, stored, and used throughout the system.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Structure](#database-structure)
4. [Current Pricing Plans](#current-pricing-plans)
5. [Adding or Updating Prices](#adding-or-updating-prices)
6. [How It Works](#how-it-works)
7. [Webhook Integration](#webhook-integration)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Overview

The pricing system uses a **database-driven approach** to map Stripe price IDs to subscription plans. This eliminates the need to hardcode price IDs in environment variables or code, making the system more maintainable and flexible.

### Key Features

- ✅ **No hardcoded price IDs** - All prices are stored in the database
- ✅ **Supports multiple prices per product** - Monthly and yearly pricing for the same plan
- ✅ **Works with discounts** - Price IDs remain the same even when discounts are applied
- ✅ **Automatic plan detection** - Webhooks automatically determine the plan from price IDs
- ✅ **Easy price updates** - Update prices in the database without code changes

## Architecture

The pricing system consists of three main components:

1. **Database Table** (`stripe_prices`) - Stores the mapping between Stripe price IDs and plans
2. **Webhook Handler** - Uses the database to determine plans from Stripe price IDs
3. **UI Components** - Display pricing information from the `STRIPE_CONFIG` constant

### Data Flow

```
Stripe Webhook → Price ID → Database Lookup → Plan Detection → Database Update
```

## Database Structure

### `stripe_prices` Table

The `stripe_prices` table maps Stripe price IDs to subscription plans and billing periods.

```sql
CREATE TABLE public.stripe_prices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_price_id text NOT NULL UNIQUE,
  stripe_product_id text,
  plan subscription_plan NOT NULL,
  billing_period text NOT NULL CHECK (billing_period IN ('monthly', 'yearly', 'annual')),
  amount integer NOT NULL, -- Amount in cents
  currency text DEFAULT 'myr',
  interval text NOT NULL CHECK (interval IN ('month', 'year')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT stripe_prices_product_plan_unique UNIQUE (stripe_product_id, plan, billing_period)
);
```

### Key Fields

- **`stripe_price_id`** - The Stripe price ID (e.g., `price_1Sv1D4R1e0xWw6LDXMraNJfF`)
- **`stripe_product_id`** - The Stripe product ID (optional, for reference)
- **`plan`** - The subscription plan (`free`, `standard`, `pro`)
- **`billing_period`** - Billing period (`monthly`, `yearly`, `annual`)
- **`amount`** - Price in cents (e.g., 7900 = RM 79.00)
- **`interval`** - Stripe interval (`month` or `year`)
- **`is_active`** - Whether this price is currently active

### Indexes

The table has indexes for fast lookups:
- `idx_stripe_prices_price_id` - Lookup by Stripe price ID
- `idx_stripe_prices_product_id` - Lookup by product ID
- `idx_stripe_prices_amount_interval` - Fallback lookup by amount + interval
- `idx_stripe_prices_plan_billing` - Lookup by plan and billing period

## Current Pricing Plans

### Free Plan
- **Price**: RM 0.00
- **Limits**:
  - Events per month: Unlimited
  - Members: Up to 50
- **Features**: Basic mosque management features

### Standard Plan
- **Monthly**: RM 79.00/month
- **Yearly**: RM 758.40/year (20% discount, equivalent to RM 63.20/month)
- **Limits**:
  - Events per month: Unlimited
  - Members: Up to 500
- **Features**: All free features plus advanced management tools

### Pro Plan
- **Monthly**: RM 399.00/month
- **Yearly**: RM 3,830.40/year (20% discount, equivalent to RM 319.20/month)
- **Limits**:
  - Events per month: Unlimited
  - Members: Unlimited
  - Mosques: Unlimited
- **Features**: All standard features plus priority support and advanced analytics

## Adding or Updating Prices

### Method 1: Using SQL Migration (Recommended)

1. Create a new migration file or update `20250208000001_seed_stripe_prices.sql`:

```sql
-- Add or update a price
INSERT INTO public.stripe_prices (
  stripe_price_id, 
  stripe_product_id, 
  plan, 
  billing_period, 
  amount, 
  currency, 
  interval, 
  is_active
)
VALUES 
  ('price_YOUR_PRICE_ID', 'prod_YOUR_PRODUCT_ID', 'standard', 'monthly', 7900, 'myr', 'month', true)
ON CONFLICT (stripe_price_id) DO UPDATE SET
  stripe_product_id = EXCLUDED.stripe_product_id,
  plan = EXCLUDED.plan,
  billing_period = EXCLUDED.billing_period,
  amount = EXCLUDED.amount,
  updated_at = now();
```

2. Run the migration:
```bash
supabase migration up
```

### Method 2: Using Supabase Dashboard

1. Go to Supabase Dashboard → Table Editor → `stripe_prices`
2. Click "Insert row" or edit an existing row
3. Fill in the required fields:
   - `stripe_price_id`: Your Stripe price ID
   - `plan`: `free`, `standard`, or `pro`
   - `billing_period`: `monthly` or `yearly`
   - `amount`: Price in cents (e.g., 7900 for RM 79.00)
   - `interval`: `month` or `year`
   - `is_active`: `true` or `false`

### Method 3: Using SQL Directly

```sql
-- Update an existing price
UPDATE public.stripe_prices
SET 
  amount = 8900,  -- New price in cents (RM 89.00)
  updated_at = now()
WHERE stripe_price_id = 'price_1Sv1D4R1e0xWw6LDXMraNJfF';

-- Deactivate a price (soft delete)
UPDATE public.stripe_prices
SET 
  is_active = false,
  updated_at = now()
WHERE stripe_price_id = 'price_OLD_PRICE_ID';
```

## How It Works

### 1. Webhook Processing

When Stripe sends a webhook event (e.g., `customer.subscription.updated`), the webhook handler:

1. Extracts the `price_id` from the subscription
2. Looks up the plan in the `stripe_prices` table using the price ID
3. Falls back to amount + interval lookup if price ID not found
4. Updates the subscription in the database with the detected plan

### 2. Plan Detection Logic

The webhook handler uses this priority order:

1. **Price ID lookup** (primary) - Look up by `stripe_price_id`
2. **Amount + interval lookup** (fallback) - Look up by `amount` and `interval`
3. **Metadata fallback** (last resort) - Use plan from subscription metadata

### 3. Discount Handling

The system works correctly with discounts because:
- Stripe maintains the original `price_id` even when discounts are applied
- The lookup uses the original price ID, not the discounted amount
- Discounts are handled separately by Stripe

## Webhook Integration

The webhook handler (`supabase/functions/stripe-webhook/index.ts`) uses the pricing table in several places:

### Subscription Updated Handler

```typescript
// Get price information from subscription
const price = subscription.items?.data?.[0]?.price;
const priceId = price?.id;

// Look up plan from database using price ID
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
```

### Benefits

- ✅ No hardcoded price IDs in code
- ✅ Easy to add new prices or plans
- ✅ Supports multiple prices per product (monthly/yearly)
- ✅ Works with discounts automatically
- ✅ Centralized price management

## Best Practices

### 1. Always Use Database for Price Lookups

❌ **Don't** hardcode price IDs in environment variables:
```env
STRIPE_STANDARD_PRICE_ID=price_xxx  # Avoid this
```

✅ **Do** store prices in the database:
```sql
INSERT INTO stripe_prices (stripe_price_id, plan, ...) VALUES (...)
```

### 2. Keep Prices in Sync

- When you create a new price in Stripe, immediately add it to the database
- When you update a price in Stripe, update the database amount
- When you deactivate a price in Stripe, set `is_active = false` in the database

### 3. Use Migrations for Price Changes

- Create migration files for price changes
- This allows version control and easy rollback
- Makes it easy to track price history

### 4. Test Price Lookups

After adding a new price, test that the webhook can find it:
1. Create a test subscription with the new price
2. Check the webhook logs to verify plan detection
3. Verify the database is updated correctly

### 5. Handle Price Changes Gracefully

- When changing prices, create new Stripe prices (don't modify existing ones)
- Deactivate old prices instead of deleting them
- This preserves historical data and prevents issues with existing subscriptions

## Troubleshooting

### Issue: Plan not detected from price ID

**Symptoms**: Webhook logs show plan as `undefined` or falls back to metadata

**Solutions**:
1. Check if the price ID exists in the database:
   ```sql
   SELECT * FROM stripe_prices WHERE stripe_price_id = 'price_xxx';
   ```
2. Verify `is_active = true`
3. Check if the price ID in Stripe matches the database
4. Check webhook logs for lookup errors

### Issue: Wrong plan detected

**Symptoms**: Subscription shows wrong plan after webhook processing

**Solutions**:
1. Verify the price ID mapping in the database
2. Check if multiple prices have the same amount (use price ID lookup, not amount lookup)
3. Verify the Stripe subscription is using the correct price ID

### Issue: Price not found in database

**Symptoms**: Webhook falls back to metadata or amount lookup

**Solutions**:
1. Add the missing price to the database
2. Verify the price ID is correct (check Stripe Dashboard)
3. Run the seed migration to add standard prices

### Issue: Discounts not working

**Symptoms**: Plan detection fails when user has a discount

**Solutions**:
- This shouldn't happen - the system uses `price_id` which doesn't change with discounts
- Verify the price ID lookup is working correctly
- Check that the original price (before discount) exists in the database

## Example: Adding a New Price

Let's say you want to add a yearly price for the Standard plan:

1. **Create the price in Stripe Dashboard**:
   - Go to Products → Standard Plan
   - Add a new recurring price: RM 758.40/year
   - Copy the Price ID (e.g., `price_1ABC123...`)

2. **Add to database**:
   ```sql
   INSERT INTO public.stripe_prices (
     stripe_price_id, 
     stripe_product_id, 
     plan, 
     billing_period, 
     amount, 
     currency, 
     interval, 
     is_active
   )
   VALUES 
     ('price_1ABC123...', 'prod_STANDARD', 'standard', 'yearly', 75840, 'myr', 'year', true)
   ON CONFLICT (stripe_price_id) DO UPDATE SET
     amount = EXCLUDED.amount,
     updated_at = now();
   ```

3. **Test**:
   - Create a test subscription with the new yearly price
   - Verify the webhook detects it correctly
   - Check the database shows the correct plan and billing period

## Related Files

- **Database Migration**: `supabase/migrations/20250208000000_create_stripe_prices_table.sql`
- **Seed Data**: `supabase/migrations/20250208000001_seed_stripe_prices.sql`
- **RLS Policies**: `supabase/migrations/20250208000002_add_stripe_prices_rls.sql`
- **Webhook Handler**: `supabase/functions/stripe-webhook/index.ts`
- **Pricing Config**: `src/lib/stripe.ts` (for UI display)

## Security

### Row Level Security (RLS)

The `stripe_prices` table has RLS enabled with the following policies:

- **Service Role**: Can read all prices (for webhook processing)
- **Authenticated Users**: Can read active prices only (for UI display)

This ensures:
- Webhooks can access all prices (including inactive ones for historical lookups)
- Users can only see active prices in the UI
- Price management is restricted to service role

## Summary

The pricing system provides a flexible, maintainable way to manage subscription prices without hardcoding. By storing prices in the database and using them in webhook processing, the system can:

- ✅ Automatically detect plans from Stripe price IDs
- ✅ Support multiple prices per product (monthly/yearly)
- ✅ Work correctly with discounts
- ✅ Easily add or update prices without code changes
- ✅ Maintain a clear audit trail of price changes

For questions or issues, refer to the troubleshooting section or check the webhook logs for detailed error messages.
