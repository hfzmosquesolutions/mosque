-- Update upsert_mosque_payment_provider function to include webhook_url and redirect_url parameters

-- Drop the existing function first
DROP FUNCTION IF EXISTS upsert_mosque_payment_provider(uuid, payment_provider_type, boolean, boolean, text, text, text);

-- Create updated function with webhook_url and redirect_url parameters
CREATE OR REPLACE FUNCTION upsert_mosque_payment_provider(
  p_mosque_id uuid,
  p_provider_type payment_provider_type,
  p_is_active boolean DEFAULT true,
  p_is_sandbox boolean DEFAULT true,
  p_billplz_api_key text DEFAULT NULL,
  p_billplz_x_signature_key text DEFAULT NULL,
  p_billplz_collection_id text DEFAULT NULL,
  p_webhook_url text DEFAULT NULL,
  p_redirect_url text DEFAULT NULL
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
    webhook_url,
    redirect_url,
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
    p_webhook_url,
    p_redirect_url,
    now()
  )
  ON CONFLICT (mosque_id, provider_type)
  DO UPDATE SET
    is_active = EXCLUDED.is_active,
    is_sandbox = EXCLUDED.is_sandbox,
    billplz_api_key = COALESCE(EXCLUDED.billplz_api_key, mosque_payment_providers.billplz_api_key),
    billplz_x_signature_key = COALESCE(EXCLUDED.billplz_x_signature_key, mosque_payment_providers.billplz_x_signature_key),
    billplz_collection_id = COALESCE(EXCLUDED.billplz_collection_id, mosque_payment_providers.billplz_collection_id),
    webhook_url = EXCLUDED.webhook_url,
    redirect_url = EXCLUDED.redirect_url,
    updated_at = now()
  RETURNING id INTO provider_id;
  
  RETURN provider_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_mosque_payment_provider(uuid, payment_provider_type, boolean, boolean, text, text, text, text, text) TO authenticated;