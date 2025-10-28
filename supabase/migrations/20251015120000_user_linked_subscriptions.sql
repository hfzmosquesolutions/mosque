-- Migration: Switch subscriptions linkage from mosque to user (add user_subscriptions)
-- Safe approach: create new tables, backfill from mosques -> user_id when available

BEGIN;

-- Create user_subscriptions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'subscription_status'
  ) THEN
    CREATE TYPE subscription_status AS ENUM (
      'active','inactive','past_due','canceled','unpaid','trialing'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'subscription_plan'
  ) THEN
    CREATE TYPE subscription_plan AS ENUM (
      'free','premium','enterprise'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  provider text NOT NULL DEFAULT 'stripe',
  external_customer_id text,
  external_subscription_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan subscription_plan NOT NULL DEFAULT 'free'::subscription_plan,
  status subscription_status NOT NULL DEFAULT 'active'::subscription_status,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Optional: invoices table for users (parallel to mosque invoices)
CREATE TABLE IF NOT EXISTS public.user_subscription_invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'stripe',
  external_invoice_id text,
  stripe_invoice_id text,
  amount_paid integer NOT NULL,
  currency text DEFAULT 'myr',
  status text NOT NULL,
  invoice_url text,
  hosted_invoice_url text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT user_subscription_invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_subscription_invoices_stripe_id_unique UNIQUE (stripe_invoice_id)
);

-- Ensure uniqueness across providers when using external_invoice_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'user_sub_invoices_provider_external_unique'
  ) THEN
    CREATE UNIQUE INDEX user_sub_invoices_provider_external_unique
      ON public.user_subscription_invoices (provider, external_invoice_id)
      WHERE external_invoice_id IS NOT NULL;
  END IF;
END $$;

-- Backfill: create free active user subscriptions for mosque owners if not existing
INSERT INTO public.user_subscriptions (user_id, plan, status, provider)
SELECT DISTINCT m.user_id, 'free'::subscription_plan, 'active'::subscription_status, 'stripe'
FROM public.mosques m
LEFT JOIN public.user_subscriptions us ON us.user_id = m.user_id
WHERE m.user_id IS NOT NULL AND us.user_id IS NULL;

COMMIT;


