-- Migration: Fix mosque_has_payment_provider function to support ToyyibPay
-- This migration updates the mosque_has_payment_provider function to check appropriate fields based on provider type

-- Drop the existing function
DROP FUNCTION IF EXISTS mosque_has_payment_provider(uuid, payment_provider_type);

-- Create updated function with conditional logic for different provider types
CREATE OR REPLACE FUNCTION mosque_has_payment_provider(
  p_mosque_id uuid,
  p_provider_type payment_provider_type
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if mosque has active payment provider with required fields based on provider type
  CASE p_provider_type
    WHEN 'billplz' THEN
      RETURN EXISTS (
        SELECT 1 FROM mosque_payment_providers
        WHERE mosque_id = p_mosque_id 
          AND provider_type = p_provider_type 
          AND is_active = true
          AND billplz_api_key IS NOT NULL
          AND billplz_collection_id IS NOT NULL
      );
    
    WHEN 'toyyibpay' THEN
      RETURN EXISTS (
        SELECT 1 FROM mosque_payment_providers
        WHERE mosque_id = p_mosque_id 
          AND provider_type = p_provider_type 
          AND is_active = true
          AND toyyibpay_secret_key IS NOT NULL
          AND toyyibpay_category_code IS NOT NULL
      );
    
    WHEN 'chip' THEN
      RETURN EXISTS (
        SELECT 1 FROM mosque_payment_providers
        WHERE mosque_id = p_mosque_id 
          AND provider_type = p_provider_type 
          AND is_active = true
          AND chip_brand_id IS NOT NULL
          AND chip_api_key IS NOT NULL
      );
    
    WHEN 'stripe' THEN
      RETURN EXISTS (
        SELECT 1 FROM mosque_payment_providers
        WHERE mosque_id = p_mosque_id 
          AND provider_type = p_provider_type 
          AND is_active = true
          AND stripe_publishable_key IS NOT NULL
          AND stripe_secret_key IS NOT NULL
      );
    
    ELSE
      -- For unknown provider types, return false
      RETURN false;
  END CASE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mosque_has_payment_provider(uuid, payment_provider_type) TO authenticated;

-- Add comment
COMMENT ON FUNCTION mosque_has_payment_provider(uuid, payment_provider_type) IS 'Checks if a mosque has an active payment provider configured with all required fields for the specified provider type';