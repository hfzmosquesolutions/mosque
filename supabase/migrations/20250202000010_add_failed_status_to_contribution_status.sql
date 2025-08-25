-- Migration: Add 'failed' status to contribution_status enum
-- This migration adds the 'failed' status to the existing contribution_status enum
-- to handle payment failures properly

-- Add 'failed' to the contribution_status enum
ALTER TYPE contribution_status ADD VALUE 'failed';

-- Add comment for documentation
COMMENT ON TYPE contribution_status IS 'Status of contribution: pending, completed, cancelled, failed';