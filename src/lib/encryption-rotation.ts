import crypto from 'crypto';
import { decryptCredential, encryptCredential } from './encryption';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Key Rotation Utility
 * Handles migration from old encryption key to new encryption key
 */

/**
 * Get old encryption key (for rotation)
 */
function getOldEncryptionKey(): string | null {
  const key = process.env.PAYMENT_CREDENTIALS_ENCRYPTION_KEY_OLD;
  if (!key || key.length < 32) {
    return null;
  }
  return key.substring(0, 32);
}

/**
 * Get new encryption key (for rotation)
 */
function getNewEncryptionKey(): string {
  const key = process.env.PAYMENT_CREDENTIALS_ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error('PAYMENT_CREDENTIALS_ENCRYPTION_KEY must be at least 32 characters');
  }
  return key.substring(0, 32);
}

/**
 * Derive key from master key using PBKDF2
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Decrypt using old key (for rotation)
 */
function decryptWithOldKey(ciphertext: string): string {
  const oldKey = getOldEncryptionKey();
  if (!oldKey) {
    throw new Error('Old encryption key not available');
  }

  const combined = Buffer.from(ciphertext, 'base64');
  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const encrypted = combined.subarray(
    SALT_LENGTH + IV_LENGTH,
    combined.length - TAG_LENGTH
  );
  const tag = combined.subarray(combined.length - TAG_LENGTH);

  const key = deriveKey(oldKey, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}

/**
 * Re-encrypt a credential with new key
 * Tries old key first, then new key, then returns as-is if neither works
 */
export function reencryptCredential(ciphertext: string | null | undefined): string {
  if (!ciphertext) {
    return '';
  }

  // If it's not encrypted (plaintext), encrypt with new key
  if (ciphertext.length < 50) {
    return encryptCredential(ciphertext);
  }

  // Try to decrypt with old key first (if available)
  const oldKey = getOldEncryptionKey();
  if (oldKey) {
    try {
      const decrypted = decryptWithOldKey(ciphertext);
      // Re-encrypt with new key
      return encryptCredential(decrypted);
    } catch (error) {
      // Old key didn't work, try new key
      console.warn('Failed to decrypt with old key, trying new key:', error);
    }
  }

  // Try to decrypt with new key (might already be encrypted with new key)
  try {
    const decrypted = decryptCredential(ciphertext);
    // Already encrypted with new key, return as-is
    return ciphertext;
  } catch (error) {
    // Neither key worked - might be corrupted or using different key
    console.error('Failed to decrypt with both keys:', error);
    throw new Error('Cannot decrypt credential - key mismatch or corrupted data');
  }
}

/**
 * Check if credential needs re-encryption
 * Returns true if encrypted with old key or plaintext
 */
export function needsReencryption(ciphertext: string | null | undefined): boolean {
  if (!ciphertext) {
    return false;
  }

  // Plaintext needs encryption
  if (ciphertext.length < 50) {
    return true;
  }

  // If old key is set, try to decrypt with it
  const oldKey = getOldEncryptionKey();
  if (oldKey) {
    try {
      decryptWithOldKey(ciphertext);
      return true; // Successfully decrypted with old key = needs re-encryption
    } catch (error) {
      // Can't decrypt with old key, might be encrypted with new key
      return false;
    }
  }

  return false;
}

/**
 * Batch re-encrypt all credentials for a provider
 * Useful for migration scripts
 */
export async function reencryptProviderCredentials(provider: {
  billplz_api_key?: string | null;
  billplz_x_signature_key?: string | null;
  toyyibpay_secret_key?: string | null;
  stripe_secret_key?: string | null;
  chip_api_key?: string | null;
}): Promise<{
  billplz_api_key?: string | null;
  billplz_x_signature_key?: string | null;
  toyyibpay_secret_key?: string | null;
  stripe_secret_key?: string | null;
  chip_api_key?: string | null;
  reencrypted: boolean;
}> {
  let reencrypted = false;

  const result: typeof provider = {};

  if (provider.billplz_api_key && needsReencryption(provider.billplz_api_key)) {
    result.billplz_api_key = reencryptCredential(provider.billplz_api_key);
    reencrypted = true;
  } else {
    result.billplz_api_key = provider.billplz_api_key;
  }

  if (provider.billplz_x_signature_key && needsReencryption(provider.billplz_x_signature_key)) {
    result.billplz_x_signature_key = reencryptCredential(provider.billplz_x_signature_key);
    reencrypted = true;
  } else {
    result.billplz_x_signature_key = provider.billplz_x_signature_key;
  }

  if (provider.toyyibpay_secret_key && needsReencryption(provider.toyyibpay_secret_key)) {
    result.toyyibpay_secret_key = reencryptCredential(provider.toyyibpay_secret_key);
    reencrypted = true;
  } else {
    result.toyyibpay_secret_key = provider.toyyibpay_secret_key;
  }

  if (provider.stripe_secret_key && needsReencryption(provider.stripe_secret_key)) {
    result.stripe_secret_key = reencryptCredential(provider.stripe_secret_key);
    reencrypted = true;
  } else {
    result.stripe_secret_key = provider.stripe_secret_key;
  }

  if (provider.chip_api_key && needsReencryption(provider.chip_api_key)) {
    result.chip_api_key = reencryptCredential(provider.chip_api_key);
    reencrypted = true;
  } else {
    result.chip_api_key = provider.chip_api_key;
  }

  return { ...result, reencrypted };
}

