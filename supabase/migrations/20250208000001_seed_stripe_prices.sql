-- Migration: Seed stripe_prices table with existing Stripe price IDs
-- Update these values with your actual Stripe price IDs and product IDs from your Stripe dashboard
-- Each product can have multiple prices (monthly and yearly)

-- Standard Monthly (RM 79.00)
INSERT INTO public.stripe_prices (stripe_price_id, stripe_product_id, plan, billing_period, amount, currency, interval, is_active)
VALUES 
  ('price_1Sv1D4R1e0xWw6LDXMraNJfF', 'prod_Tsmmx3lgisYJvT', 'standard', 'monthly', 7900, 'myr', 'month', true)
ON CONFLICT (stripe_price_id) DO UPDATE SET
  stripe_product_id = EXCLUDED.stripe_product_id,
  plan = EXCLUDED.plan,
  billing_period = EXCLUDED.billing_period,
  amount = EXCLUDED.amount,
  updated_at = now();

-- TODO: Add your other prices below. Get them from Stripe Dashboard → Products
-- Standard Yearly (RM 758.40) - if you have one
-- Pro Monthly (RM 399.00) - if you have one  
-- Pro Yearly (RM 3,830.40) - if you have one

-- Standard Yearly (RM 758.40)
-- Replace 'price_YOUR_STANDARD_YEARLY_ID' and 'prod_YOUR_STANDARD_PRODUCT_ID' with your actual IDs
-- INSERT INTO public.stripe_prices (stripe_price_id, stripe_product_id, plan, billing_period, amount, currency, interval, is_active)
-- VALUES 
--   ('price_YOUR_STANDARD_YEARLY_ID', 'prod_YOUR_STANDARD_PRODUCT_ID', 'standard', 'yearly', 75840, 'myr', 'year', true)
-- ON CONFLICT (stripe_price_id) DO UPDATE SET
--   stripe_product_id = EXCLUDED.stripe_product_id,
--   plan = EXCLUDED.plan,
--   billing_period = EXCLUDED.billing_period,
--   amount = EXCLUDED.amount,
--   updated_at = now();

-- Pro Monthly (RM 399.00)
-- Replace 'price_YOUR_PRO_MONTHLY_ID' and 'prod_YOUR_PRO_PRODUCT_ID' with your actual IDs
-- INSERT INTO public.stripe_prices (stripe_price_id, stripe_product_id, plan, billing_period, amount, currency, interval, is_active)
-- VALUES 
--   ('price_YOUR_PRO_MONTHLY_ID', 'prod_YOUR_PRO_PRODUCT_ID', 'pro', 'monthly', 39900, 'myr', 'month', true)
-- ON CONFLICT (stripe_price_id) DO UPDATE SET
--   stripe_product_id = EXCLUDED.stripe_product_id,
--   plan = EXCLUDED.plan,
--   billing_period = EXCLUDED.billing_period,
--   amount = EXCLUDED.amount,
--   updated_at = now();

-- Pro Yearly (RM 3,830.40)
-- Replace 'price_YOUR_PRO_YEARLY_ID' and 'prod_YOUR_PRO_PRODUCT_ID' with your actual IDs
-- INSERT INTO public.stripe_prices (stripe_price_id, stripe_product_id, plan, billing_period, amount, currency, interval, is_active)
-- VALUES 
--   ('price_YOUR_PRO_YEARLY_ID', 'prod_YOUR_PRO_PRODUCT_ID', 'pro', 'yearly', 383040, 'myr', 'year', true)
-- ON CONFLICT (stripe_price_id) DO UPDATE SET
--   stripe_product_id = EXCLUDED.stripe_product_id,
--   plan = EXCLUDED.plan,
--   billing_period = EXCLUDED.billing_period,
--   amount = EXCLUDED.amount,
--   updated_at = now();
