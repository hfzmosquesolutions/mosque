-- Migration: Create stripe_prices table to map Stripe price IDs to plans
-- This allows us to look up plan information from price IDs without hardcoding
-- Supports same product with multiple prices (e.g., monthly and yearly)

CREATE TABLE IF NOT EXISTS public.stripe_prices (
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
  -- Ensure same product can have multiple prices (monthly + yearly)
  CONSTRAINT stripe_prices_product_plan_unique UNIQUE (stripe_product_id, plan, billing_period)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_stripe_prices_price_id ON public.stripe_prices(stripe_price_id);
CREATE INDEX IF NOT EXISTS idx_stripe_prices_product_id ON public.stripe_prices(stripe_product_id);
CREATE INDEX IF NOT EXISTS idx_stripe_prices_amount_interval ON public.stripe_prices(amount, interval);
CREATE INDEX IF NOT EXISTS idx_stripe_prices_plan_billing ON public.stripe_prices(plan, billing_period);

-- Add comment
COMMENT ON TABLE public.stripe_prices IS 'Maps Stripe price IDs to subscription plans. Supports same product with multiple prices (monthly/yearly). Used by webhooks to determine plan from price. Note: Works with discounts - price_id remains the same even when discounts are applied.';
