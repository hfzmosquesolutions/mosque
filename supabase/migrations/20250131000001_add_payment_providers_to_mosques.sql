-- Add payment provider settings to mosques table
-- This migration adds support for storing payment provider credentials per mosque

-- Create enum for payment provider types
CREATE TYPE payment_provider_type AS ENUM ('billplz', 'chip', 'stripe');

-- Create table for mosque payment providers
CREATE TABLE mosque_payment_providers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  mosque_id uuid NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  provider_type payment_provider_type NOT NULL,
  is_active boolean DEFAULT true,
  is_sandbox boolean DEFAULT true,
  
  -- Billplz specific fields
  billplz_api_key text,
  billplz_x_signature_key text,
  billplz_collection_id text,
  
  -- CHIP specific fields (for future use)
  chip_brand_id text,
  chip_api_key text,
  
  -- Stripe specific fields (for future use)
  stripe_publishable_key text,
  stripe_secret_key text,
  
  -- Common fields
  webhook_url text,
  redirect_url text,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Ensure only one active provider per type per mosque
  UNIQUE(mosque_id, provider_type)
);

-- Enable RLS on mosque_payment_providers
ALTER TABLE mosque_payment_providers ENABLE ROW LEVEL SECURITY;

-- Policy: Only mosque owners/admins can manage their payment providers
CREATE POLICY "Mosque owners can manage payment providers" ON mosque_payment_providers
  FOR ALL USING (
    mosque_id IN (
      SELECT m.id FROM mosques m 
      WHERE m.user_id = auth.uid()
    )
  );

-- Policy: Prevent client-side access to sensitive keys
CREATE POLICY "Prevent client access to sensitive keys" ON mosque_payment_providers
  FOR SELECT USING (false);

-- Create function to get payment provider for server-side use only
CREATE OR REPLACE FUNCTION get_mosque_payment_provider(
  p_mosque_id uuid,
  p_provider_type payment_provider_type
)
RETURNS mosque_payment_providers
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  provider_record mosque_payment_providers;
BEGIN
  -- This function can only be called from server-side with service role
  SELECT * INTO provider_record
  FROM mosque_payment_providers
  WHERE mosque_id = p_mosque_id 
    AND provider_type = p_provider_type 
    AND is_active = true;
  
  RETURN provider_record;
END;
$$;

-- Grant execute permission to service role only
GRANT EXECUTE ON FUNCTION get_mosque_payment_provider(uuid, payment_provider_type) TO service_role;

-- Create function to update payment provider settings (without exposing keys)
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
    webhook_url = COALESCE(EXCLUDED.webhook_url, mosque_payment_providers.webhook_url),
    redirect_url = COALESCE(EXCLUDED.redirect_url, mosque_payment_providers.redirect_url),
    updated_at = now()
  RETURNING id INTO provider_id;
  
  RETURN provider_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_mosque_payment_provider(uuid, payment_provider_type, boolean, boolean, text, text, text, text, text) TO authenticated;

-- Create function to check if mosque has active payment provider
CREATE OR REPLACE FUNCTION mosque_has_payment_provider(
  p_mosque_id uuid,
  p_provider_type payment_provider_type
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM mosque_payment_providers
    WHERE mosque_id = p_mosque_id 
      AND provider_type = p_provider_type 
      AND is_active = true
      AND billplz_api_key IS NOT NULL
      AND billplz_collection_id IS NOT NULL
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mosque_has_payment_provider(uuid, payment_provider_type) TO authenticated;

-- Add indexes for performance
CREATE INDEX idx_mosque_payment_providers_mosque_id ON mosque_payment_providers(mosque_id);
CREATE INDEX idx_mosque_payment_providers_active ON mosque_payment_providers(mosque_id, provider_type, is_active);

-- Add comment
COMMENT ON TABLE mosque_payment_providers IS 'Stores payment provider credentials and settings for each mosque. Sensitive keys are protected by RLS and can only be accessed server-side.';