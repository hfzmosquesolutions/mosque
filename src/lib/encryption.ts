import crypto from 'crypto';

/**
 * Encryption utility for payment provider credentials
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for AES
const SALT_LENGTH = 64; // 64 bytes for salt
const TAG_LENGTH = 16; // 16 bytes for GCM auth tag
const KEY_LENGTH = 32; // 32 bytes for AES-256

/**
 * Get encryption key from environment variable
 * Falls back to a default key in development (NOT for production!)
 * Supports key rotation by checking for old key
 */
function getEncryptionKey(): string {
  const key = process.env.PAYMENT_CREDENTIALS_ENCRYPTION_KEY;
  
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'PAYMENT_CREDENTIALS_ENCRYPTION_KEY environment variable is required in production'
      );
    }
    // Development fallback - WARNING: Change this in production!
    console.warn(
      '⚠️  PAYMENT_CREDENTIALS_ENCRYPTION_KEY not set. Using default key (INSECURE for production!)'
    );
    return 'default-dev-key-change-in-production-32chars!!';
  }
  
  // Ensure key is exactly 32 bytes (256 bits) for AES-256
  if (key.length < 32) {
    throw new Error(
      'PAYMENT_CREDENTIALS_ENCRYPTION_KEY must be at least 32 characters long'
    );
  }
  
  // Use first 32 bytes of the key
  return key.substring(0, 32);
}

/**
 * Get old encryption key (for rotation scenarios)
 * Returns null if not set
 */
function getOldEncryptionKey(): string | null {
  const key = process.env.PAYMENT_CREDENTIALS_ENCRYPTION_KEY_OLD;
  if (!key || key.length < 32) {
    return null;
  }
  return key.substring(0, 32);
}

/**
 * Derive a key from the master key using PBKDF2
 * This adds an extra layer of security
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt a payment credential
 * Returns base64-encoded string: salt + iv + encrypted_data + auth_tag
 */
export function encryptCredential(plaintext: string): string {
  if (!plaintext) {
    return '';
  }
  
  try {
    const masterKey = getEncryptionKey();
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = deriveKey(masterKey, salt);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const tag = cipher.getAuthTag();
    
    // Combine: salt + iv + encrypted_data + auth_tag
    const combined = Buffer.concat([salt, iv, encrypted, tag]);
    
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt credential');
  }
}

/**
 * Decrypt a payment credential
 * Expects base64-encoded string: salt + iv + encrypted_data + auth_tag
 */
export function decryptCredential(ciphertext: string): string {
  if (!ciphertext) {
    return '';
  }
  
  try {
    const masterKey = getEncryptionKey();
    const combined = Buffer.from(ciphertext, 'base64');
    
    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const encrypted = combined.subarray(
      SALT_LENGTH + IV_LENGTH,
      combined.length - TAG_LENGTH
    );
    const tag = combined.subarray(combined.length - TAG_LENGTH);
    
    const key = deriveKey(masterKey, salt);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt credential - may be corrupted or wrong key');
  }
}

/**
 * Mask a credential for display (shows only last 4 characters)
 * Example: "sk_live_1234567890abcdef" -> "****cdef"
 */
export function maskCredential(credential: string | null | undefined): string {
  if (!credential) {
    return '';
  }
  
  if (credential.length <= 4) {
    return '****';
  }
  
  return '****' + credential.slice(-4);
}

/**
 * Check if a string is encrypted (base64 format check)
 * This is a heuristic - encrypted strings are base64 encoded
 */
export function isEncrypted(value: string): boolean {
  if (!value) {
    return false;
  }
  
  // Encrypted values are base64, so they should:
  // 1. Be longer than a typical credential (encryption adds overhead)
  // 2. Match base64 pattern
  const base64Pattern = /^[A-Za-z0-9+/]+=*$/;
  
  // If it's short and doesn't look like base64, it's probably plaintext
  if (value.length < 50) {
    return false;
  }
  
  // Check if it matches base64 pattern
  return base64Pattern.test(value) && value.length % 4 === 0;
}

/**
 * Encrypt credential if it's not already encrypted
 * Useful for migration scenarios
 */
export function encryptIfNeeded(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  
  // If already encrypted, return as-is
  if (isEncrypted(value)) {
    return value;
  }
  
  // Encrypt plaintext
  return encryptCredential(value);
}

/**
 * Decrypt credential if it's encrypted, otherwise return as-is
 * Supports key rotation by trying old key if new key fails
 * Useful for backward compatibility during migration
 */
export function decryptIfNeeded(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  
  // If not encrypted, return as-is
  if (!isEncrypted(value)) {
    return value;
  }
  
  // Try to decrypt with current key first
  try {
    return decryptCredential(value);
  } catch (error) {
    // If decryption fails, try old key (for rotation scenarios)
    const oldKey = getOldEncryptionKey();
    if (oldKey) {
      try {
        return decryptWithOldKey(value, oldKey);
      } catch (oldKeyError) {
        console.warn('Decryption failed with both new and old key:', oldKeyError);
        throw new Error('Cannot decrypt credential - key mismatch or corrupted data');
      }
    }
    
    // If decryption fails and no old key, might be plaintext after all
    console.warn('Decryption failed, returning as-is:', error);
    return value;
  }
}

/**
 * Decrypt using old key (internal helper for rotation)
 */
function decryptWithOldKey(ciphertext: string, oldKey: string): string {
  const combined = Buffer.from(ciphertext, 'base64');
  
  // Extract components
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

