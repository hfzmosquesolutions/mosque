-- Migration: Add encryption support for payment provider credentials
-- This migration enables encryption at rest for sensitive payment credentials
-- Uses application-level encryption (AES-256-GCM) rather than database-level
-- to allow for key rotation and better key management

-- Note: This migration does NOT encrypt existing data automatically
-- Existing plaintext credentials will be encrypted on next update
-- See migration script for data migration if needed

-- Add comment to document encryption
COMMENT ON COLUMN mosque_payment_providers.billplz_api_key IS 
  'Billplz API Key - Encrypted at rest using AES-256-GCM. Decrypted only when needed for API calls.';

COMMENT ON COLUMN mosque_payment_providers.billplz_x_signature_key IS 
  'Billplz X-Signature Key - Encrypted at rest using AES-256-GCM. Used for webhook verification.';

COMMENT ON COLUMN mosque_payment_providers.toyyibpay_secret_key IS 
  'ToyyibPay Secret Key - Encrypted at rest using AES-256-GCM. Decrypted only when needed for API calls.';

COMMENT ON COLUMN mosque_payment_providers.stripe_secret_key IS 
  'Stripe Secret Key - Encrypted at rest using AES-256-GCM. Decrypted only when needed for API calls.';

COMMENT ON COLUMN mosque_payment_providers.chip_api_key IS 
  'CHIP API Key - Encrypted at rest using AES-256-GCM. Decrypted only when needed for API calls.';

-- Add encryption metadata columns (optional, for tracking)
-- These can help identify which records are encrypted
ALTER TABLE mosque_payment_providers 
ADD COLUMN IF NOT EXISTS credentials_encrypted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS encryption_version integer DEFAULT 1;

COMMENT ON COLUMN mosque_payment_providers.credentials_encrypted_at IS 
  'Timestamp when credentials were last encrypted. NULL indicates plaintext (legacy data).';

COMMENT ON COLUMN mosque_payment_providers.encryption_version IS 
  'Encryption algorithm version. Allows for future algorithm upgrades.';

-- Create index for encrypted records (optional, for migration tracking)
CREATE INDEX IF NOT EXISTS idx_payment_providers_encryption_status 
ON mosque_payment_providers(credentials_encrypted_at);

-- Add comment to table
COMMENT ON TABLE mosque_payment_providers IS 
  'Stores payment provider credentials and settings for each mosque. Sensitive keys are encrypted at rest using AES-256-GCM and can only be accessed server-side. Encryption key is stored in environment variables (PAYMENT_CREDENTIALS_ENCRYPTION_KEY).';

