-- Migration: Add Subscription System
-- This migration creates the subscription system for mosque management

-- Create subscription status enum
CREATE TYPE subscription_status AS ENUM (
  'active',
  'inactive',
  'past_due',
  'canceled',
  'unpaid',
  'trialing'
);

-- Create subscription plan enum
CREATE TYPE subscription_plan AS ENUM (
  'free',
  'premium',
  'enterprise'
);

-- Create mosques_subscriptions table
CREATE TABLE public.mosque_subscriptions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  mosque_id uuid NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamp with time zone,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mosque_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT mosque_subscriptions_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES public.mosques(id) ON DELETE CASCADE,
  CONSTRAINT mosque_subscriptions_mosque_id_unique UNIQUE (mosque_id)
);

-- Create subscription_usage table for tracking feature usage
CREATE TABLE public.subscription_usage (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  mosque_id uuid NOT NULL,
  feature_name text NOT NULL,
  usage_count integer DEFAULT 0,
  limit_count integer,
  reset_period text DEFAULT 'monthly', -- monthly, yearly
  last_reset timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscription_usage_pkey PRIMARY KEY (id),
  CONSTRAINT subscription_usage_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES public.mosques(id) ON DELETE CASCADE,
  CONSTRAINT subscription_usage_mosque_feature_unique UNIQUE (mosque_id, feature_name)
);

-- Create subscription_invoices table
CREATE TABLE public.subscription_invoices (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  mosque_id uuid NOT NULL,
  stripe_invoice_id text NOT NULL,
  amount_paid integer NOT NULL, -- in cents
  currency text DEFAULT 'myr',
  status text NOT NULL,
  invoice_url text,
  hosted_invoice_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscription_invoices_pkey PRIMARY KEY (id),
  CONSTRAINT subscription_invoices_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES public.mosques(id) ON DELETE CASCADE,
  CONSTRAINT subscription_invoices_stripe_id_unique UNIQUE (stripe_invoice_id)
);

-- Create subscription_webhook_events table for tracking webhook events
CREATE TABLE public.subscription_webhook_events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  stripe_event_id text NOT NULL,
  event_type text NOT NULL,
  processed boolean DEFAULT false,
  data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscription_webhook_events_pkey PRIMARY KEY (id),
  CONSTRAINT subscription_webhook_events_stripe_id_unique UNIQUE (stripe_event_id)
);

-- Insert default free subscriptions for existing mosques
INSERT INTO public.mosque_subscriptions (mosque_id, plan, status)
SELECT id, 'free', 'active' FROM public.mosques;

-- Create indexes for better performance
CREATE INDEX idx_mosque_subscriptions_mosque_id ON public.mosque_subscriptions(mosque_id);
CREATE INDEX idx_mosque_subscriptions_stripe_customer_id ON public.mosque_subscriptions(stripe_customer_id);
CREATE INDEX idx_mosque_subscriptions_stripe_subscription_id ON public.mosque_subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscription_usage_mosque_id ON public.subscription_usage(mosque_id);
CREATE INDEX idx_subscription_invoices_mosque_id ON public.subscription_invoices(mosque_id);
CREATE INDEX idx_subscription_webhook_events_stripe_event_id ON public.subscription_webhook_events(stripe_event_id);

-- Create RLS policies
ALTER TABLE public.mosque_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for mosque_subscriptions
CREATE POLICY "Mosque admins can view their subscription" ON public.mosque_subscriptions
  FOR SELECT USING (
    mosque_id IN (
      SELECT id FROM public.mosques 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage subscriptions" ON public.mosque_subscriptions
  FOR ALL USING (true);

-- RLS policies for subscription_usage
CREATE POLICY "Mosque admins can view their usage" ON public.subscription_usage
  FOR SELECT USING (
    mosque_id IN (
      SELECT id FROM public.mosques 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage usage" ON public.subscription_usage
  FOR ALL USING (true);

-- RLS policies for subscription_invoices
CREATE POLICY "Mosque admins can view their invoices" ON public.subscription_invoices
  FOR SELECT USING (
    mosque_id IN (
      SELECT id FROM public.mosques 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage invoices" ON public.subscription_invoices
  FOR ALL USING (true);

-- RLS policies for subscription_webhook_events (admin only)
CREATE POLICY "Only system can access webhook events" ON public.subscription_webhook_events
  FOR ALL USING (false);

-- Create function to check subscription status
CREATE OR REPLACE FUNCTION public.get_mosque_subscription_status(mosque_uuid uuid)
RETURNS subscription_status
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sub_status subscription_status;
BEGIN
  SELECT status INTO sub_status
  FROM public.mosque_subscriptions
  WHERE mosque_id = mosque_uuid;
  
  RETURN COALESCE(sub_status, 'inactive'::subscription_status);
END;
$$;

-- Create function to check if feature is available
CREATE OR REPLACE FUNCTION public.is_feature_available(mosque_uuid uuid, feature_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sub_plan subscription_plan;
  sub_status subscription_status;
  usage_count integer;
  usage_limit integer;
BEGIN
  -- Get subscription details
  SELECT plan, status INTO sub_plan, sub_status
  FROM public.mosque_subscriptions
  WHERE mosque_id = mosque_uuid;
  
  -- Check if subscription is active
  IF sub_status NOT IN ('active', 'trialing') THEN
    RETURN false;
  END IF;
  
  -- Define feature availability based on plan
  CASE feature_name
    WHEN 'khairat_management' THEN
      RETURN sub_plan IN ('premium', 'enterprise');
    WHEN 'advanced_kariah' THEN
      RETURN sub_plan IN ('premium', 'enterprise');
    WHEN 'unlimited_events' THEN
      RETURN sub_plan IN ('premium', 'enterprise');
    WHEN 'financial_reports' THEN
      RETURN sub_plan IN ('premium', 'enterprise');
    WHEN 'multi_mosque' THEN
      RETURN sub_plan = 'enterprise';
    WHEN 'api_access' THEN
      RETURN sub_plan = 'enterprise';
    WHEN 'custom_branding' THEN
      RETURN sub_plan = 'enterprise';
    ELSE
      RETURN true; -- Basic features available to all
  END CASE;
END;
$$;

-- Create function to track feature usage
CREATE OR REPLACE FUNCTION public.track_feature_usage(mosque_uuid uuid, feature_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  usage_count integer;
  usage_limit integer;
  is_available boolean;
BEGIN
  -- Check if feature is available
  SELECT public.is_feature_available(mosque_uuid, feature_name) INTO is_available;
  
  IF NOT is_available THEN
    RETURN false;
  END IF;
  
  -- Get current usage and limit
  SELECT 
    COALESCE(usage_count, 0),
    COALESCE(limit_count, -1)
  INTO usage_count, usage_limit
  FROM public.subscription_usage
  WHERE mosque_id = mosque_uuid AND feature_name = track_feature_usage.feature_name;
  
  -- If no record exists, create one
  IF usage_count IS NULL THEN
    INSERT INTO public.subscription_usage (mosque_id, feature_name, usage_count, limit_count)
    VALUES (mosque_uuid, feature_name, 1, -1)
    ON CONFLICT (mosque_id, feature_name) DO NOTHING;
    RETURN true;
  END IF;
  
  -- Check if usage limit exceeded
  IF usage_limit > 0 AND usage_count >= usage_limit THEN
    RETURN false;
  END IF;
  
  -- Increment usage count
  UPDATE public.subscription_usage
  SET usage_count = usage_count + 1,
      updated_at = now()
  WHERE mosque_id = mosque_uuid AND feature_name = track_feature_usage.feature_name;
  
  RETURN true;
END;
$$;

