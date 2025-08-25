-- Migration: Add ToyyibPay payment provider support
-- This migration adds ToyyibPay as a payment provider option and adds necessary fields

-- Update payment_provider_type enum to include 'toyyibpay'
ALTER TYPE payment_provider_type ADD VALUE 'toyyibpay';

-- Add ToyyibPay specific fields to mosque_payment_providers table
ALTER TABLE mosque_payment_providers 
ADD COLUMN toyyibpay_secret_key text,
ADD COLUMN toyyibpay_category_code text;

-- Add comments for the new columns
COMMENT ON COLUMN mosque_payment_providers.toyyibpay_secret_key IS 'ToyyibPay secret key for API authentication';
COMMENT ON COLUMN mosque_payment_providers.toyyibpay_category_code IS 'ToyyibPay category code for payment categorization';

-- Update the upsert function to include ToyyibPay parameters
DROP FUNCTION IF EXISTS upsert_mosque_payment_provider(uuid, payment_provider_type, boolean, boolean, text, text, text);

-- Create updated function with ToyyibPay parameters
CREATE OR REPLACE FUNCTION upsert_mosque_payment_provider(
  p_mosque_id uuid,
  p_provider_type payment_provider_type,
  p_is_active boolean DEFAULT true,
  p_is_sandbox boolean DEFAULT true,
  p_billplz_api_key text DEFAULT NULL,
  p_billplz_x_signature_key text DEFAULT NULL,
  p_billplz_collection_id text DEFAULT NULL,
  p_toyyibpay_secret_key text DEFAULT NULL,
  p_toyyibpay_category_code text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  provider_id uuid;
  mosque_owner_id uuid;
BEGIN
  -- Check if user owns the mosque
  SELECT user_id INTO mosque_owner_id
  FROM mosques
  WHERE id = p_mosque_id;
  
  IF mosque_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: You do not own this mosque';
  END IF;
  
  -- Upsert payment provider
  INSERT INTO mosque_payment_providers (
    mosque_id,
    provider_type,
    is_active,
    is_sandbox,
    billplz_api_key,
    billplz_x_signature_key,
    billplz_collection_id,
    toyyibpay_secret_key,
    toyyibpay_category_code,
    created_at,
    updated_at
  )
  VALUES (
    p_mosque_id,
    p_provider_type,
    p_is_active,
    p_is_sandbox,
    p_billplz_api_key,
    p_billplz_x_signature_key,
    p_billplz_collection_id,
    p_toyyibpay_secret_key,
    p_toyyibpay_category_code,
    now(),
    now()
  )
  ON CONFLICT (mosque_id, provider_type)
  DO UPDATE SET
    is_active = EXCLUDED.is_active,
    is_sandbox = EXCLUDED.is_sandbox,
    billplz_api_key = EXCLUDED.billplz_api_key,
    billplz_x_signature_key = EXCLUDED.billplz_x_signature_key,
    billplz_collection_id = EXCLUDED.billplz_collection_id,
    toyyibpay_secret_key = EXCLUDED.toyyibpay_secret_key,
    toyyibpay_category_code = EXCLUDED.toyyibpay_category_code,
    updated_at = now()
  RETURNING id INTO provider_id;
  
  RETURN provider_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_mosque_payment_provider(uuid, payment_provider_type, boolean, boolean, text, text, text, text, text) TO authenticated;