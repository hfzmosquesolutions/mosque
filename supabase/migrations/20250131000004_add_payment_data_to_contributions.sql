-- Migration: Add payment_data JSON column to contributions table
-- This migration adds a flexible payment_data column to store payment provider information
-- as a single JSON object, making it future-proof for multiple payment providers

-- Add payment_data column to contributions table
ALTER TABLE contributions 
ADD COLUMN payment_data JSONB DEFAULT '{}'::jsonb;

-- Add index for payment_data queries (optional but recommended for performance)
CREATE INDEX idx_contributions_payment_data ON contributions USING gin(payment_data);

-- Add comment to document the column purpose
COMMENT ON COLUMN contributions.payment_data IS 'JSON object storing payment provider specific data (Billplz, Stripe, etc.)';

-- Example of payment_data structure for different providers:
/*
Billplz example:
{
  "provider": "billplz",
  "billplz_id": "abc123",
  "paid_at": "2025-01-31T10:30:00Z",
  "transaction_id": "txn_456",
  "transaction_status": "completed",
  "paid_amount": 50.00,
  "collection_id": "col_789",
  "state": "paid",
  "due_at": "2025-02-01T23:59:59Z",
  "mobile": "+60123456789",
  "email": "donor@example.com"
}

Stripe example:
{
  "provider": "stripe",
  "payment_intent_id": "pi_123",
  "charge_id": "ch_456",
  "paid_at": "2025-01-31T10:30:00Z",
  "transaction_fee": 1.50,
  "net_amount": 48.50,
  "currency": "myr",
  "payment_method_type": "card",
  "last4": "4242",
  "brand": "visa"
}

Other providers can follow similar patterns...
*/