-- Migration: Add billing_period to user_subscriptions
-- This allows tracking whether a subscription is monthly or yearly

ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS billing_period text DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly', 'annual'));

-- Update existing subscriptions to default to monthly
UPDATE public.user_subscriptions
SET billing_period = 'monthly'
WHERE billing_period IS NULL;
