-- Migration: Add cancellation notice field to user_subscription_invoices
-- This allows us to show a notice on invoices when subscription is canceled

ALTER TABLE public.user_subscription_invoices
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS is_final_invoice boolean DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.user_subscription_invoices.description IS 'Invoice description or notice (e.g., cancellation notice)';
COMMENT ON COLUMN public.user_subscription_invoices.is_final_invoice IS 'True if this is the final invoice before subscription cancellation';
