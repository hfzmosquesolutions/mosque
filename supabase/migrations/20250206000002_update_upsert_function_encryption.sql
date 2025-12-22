-- Migration: Update upsert function to track encryption status
-- This migration updates the upsert function to set encryption metadata
-- when credentials are updated

-- Drop and recreate the function with encryption tracking
DROP FUNCTION IF EXISTS upsert_mosque_payment_provider(uuid, payment_provider_type, boolean, boolean, text, text, text, text, text);

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
  has_encrypted_credentials boolean;
BEGIN
  -- Check if user owns the mosque
  SELECT user_id INTO mosque_owner_id
  FROM mosques
  WHERE id = p_mosque_id;
  
  IF mosque_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: You do not own this mosque';
  END IF;
  
  -- Check if any credentials are being provided (encrypted credentials are longer)
  has_encrypted_credentials := (
    (p_billplz_api_key IS NOT NULL AND length(p_billplz_api_key) > 50) OR
    (p_billplz_x_signature_key IS NOT NULL AND length(p_billplz_x_signature_key) > 50) OR
    (p_toyyibpay_secret_key IS NOT NULL AND length(p_toyyibpay_secret_key) > 50)
  );
  
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
    credentials_encrypted_at,
    encryption_version,
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
    CASE WHEN has_encrypted_credentials THEN now() ELSE NULL END,
    CASE WHEN has_encrypted_credentials THEN 1 ELSE NULL END,
    now(),
    now()
  )
  ON CONFLICT (mosque_id, provider_type)
  DO UPDATE SET
    is_active = EXCLUDED.is_active,
    is_sandbox = EXCLUDED.is_sandbox,
    billplz_api_key = COALESCE(EXCLUDED.billplz_api_key, mosque_payment_providers.billplz_api_key),
    billplz_x_signature_key = COALESCE(EXCLUDED.billplz_x_signature_key, mosque_payment_providers.billplz_x_signature_key),
    billplz_collection_id = COALESCE(EXCLUDED.billplz_collection_id, mosque_payment_providers.billplz_collection_id),
    toyyibpay_secret_key = COALESCE(EXCLUDED.toyyibpay_secret_key, mosque_payment_providers.toyyibpay_secret_key),
    toyyibpay_category_code = COALESCE(EXCLUDED.toyyibpay_category_code, mosque_payment_providers.toyyibpay_category_code),
    credentials_encrypted_at = CASE 
      WHEN has_encrypted_credentials THEN now()
      WHEN EXCLUDED.billplz_api_key IS NULL AND EXCLUDED.billplz_x_signature_key IS NULL AND EXCLUDED.toyyibpay_secret_key IS NULL 
        THEN mosque_payment_providers.credentials_encrypted_at
      ELSE mosque_payment_providers.credentials_encrypted_at
    END,
    encryption_version = CASE 
      WHEN has_encrypted_credentials THEN 1
      ELSE mosque_payment_providers.encryption_version
    END,
    updated_at = now()
  RETURNING id INTO provider_id;
  
  RETURN provider_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_mosque_payment_provider(uuid, payment_provider_type, boolean, boolean, text, text, text, text, text) TO authenticated;

