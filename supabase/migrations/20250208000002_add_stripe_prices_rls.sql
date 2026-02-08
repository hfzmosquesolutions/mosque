-- Migration: Add RLS policies for stripe_prices table
-- This table needs to be readable by service role (for webhooks) and optionally by authenticated users (for UI)

-- Enable RLS
ALTER TABLE public.stripe_prices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='stripe_prices' AND policyname='Service role can read prices'
  ) THEN DROP POLICY "Service role can read prices" ON public.stripe_prices; END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='stripe_prices' AND policyname='Authenticated users can read active prices'
  ) THEN DROP POLICY "Authenticated users can read active prices" ON public.stripe_prices; END IF;
END $$;

-- Service role can read all prices (needed for webhooks)
CREATE POLICY "Service role can read prices"
ON public.stripe_prices
FOR SELECT
TO authenticated
USING (auth.role() = 'service_role');

-- Authenticated users can read active prices (for displaying pricing in UI)
CREATE POLICY "Authenticated users can read active prices"
ON public.stripe_prices
FOR SELECT
TO authenticated
USING (is_active = true);

-- Note: Only service role should be able to insert/update/delete prices
-- This should be done via migrations or admin operations, not through the app
