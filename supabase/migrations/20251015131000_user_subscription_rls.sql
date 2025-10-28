-- Migration: RLS policies for user-linked subscription tables
BEGIN;

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscription_invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_subscriptions' AND policyname='Users can view own subscription'
  ) THEN DROP POLICY "Users can view own subscription" ON public.user_subscriptions; END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_subscriptions' AND policyname='Service role can manage subscriptions'
  ) THEN DROP POLICY "Service role can manage subscriptions" ON public.user_subscriptions; END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_subscription_invoices' AND policyname='Users can view own invoices'
  ) THEN DROP POLICY "Users can view own invoices" ON public.user_subscription_invoices; END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_subscription_invoices' AND policyname='Service role can write invoices'
  ) THEN DROP POLICY "Service role can write invoices" ON public.user_subscription_invoices; END IF;
END $$;

-- Read access: users can read their own subscription
CREATE POLICY "Users can view own subscription"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Service role full management of subscriptions (API/webhooks on server)
CREATE POLICY "Service role can manage subscriptions"
ON public.user_subscriptions
FOR ALL
TO authenticated
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Read access: users can read their own invoices
CREATE POLICY "Users can view own invoices"
ON public.user_subscription_invoices
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert/update invoices
CREATE POLICY "Service role can write invoices"
ON public.user_subscription_invoices
FOR ALL
TO authenticated
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

COMMIT;


