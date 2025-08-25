-- Migration: Enforce single active payment provider per mosque
-- This migration adds a database constraint to ensure only one payment provider can be active per mosque

-- Create a function to check single active provider constraint
CREATE OR REPLACE FUNCTION check_single_active_payment_provider()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only check if the new/updated record is being set to active
  IF NEW.is_active = true THEN
    -- Check if there's already another active payment provider for this mosque
    IF EXISTS (
      SELECT 1 FROM mosque_payment_providers
      WHERE mosque_id = NEW.mosque_id
        AND provider_type != NEW.provider_type
        AND is_active = true
        AND (TG_OP = 'INSERT' OR id != NEW.id)
    ) THEN
      RAISE EXCEPTION 'Only one payment provider can be active per mosque. Please disable other providers first.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to enforce single active payment provider
DROP TRIGGER IF EXISTS enforce_single_active_payment_provider ON mosque_payment_providers;
CREATE TRIGGER enforce_single_active_payment_provider
  BEFORE INSERT OR UPDATE ON mosque_payment_providers
  FOR EACH ROW
  EXECUTE FUNCTION check_single_active_payment_provider();

-- Add comment
COMMENT ON FUNCTION check_single_active_payment_provider() IS 'Ensures only one payment provider can be active per mosque at any time';
COMMENT ON TRIGGER enforce_single_active_payment_provider ON mosque_payment_providers IS 'Trigger to enforce single active payment provider constraint';