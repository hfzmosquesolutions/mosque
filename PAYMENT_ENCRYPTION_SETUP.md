# Payment Credentials Encryption Setup

This document explains how to set up encryption for payment provider credentials (Option 1 + Option 2 hybrid approach).

## Overview

Payment credentials (API keys, secret keys) are now encrypted at rest using **AES-256-GCM** encryption. The encryption key is stored in environment variables (external to the database), providing a secure hybrid approach.

## How It Works

1. **Encryption at Rest**: All sensitive credentials are encrypted before storing in the database
2. **External Key Management**: Encryption key is stored in environment variables (can be upgraded to AWS Secrets Manager, etc.)
3. **Automatic Decryption**: Credentials are automatically decrypted when needed for API calls
4. **Masked Responses**: API responses show only masked credentials (last 4 characters)

## Setup Instructions

### 1. Generate Encryption Key

Generate a secure 32+ character encryption key:

```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Important**: The key must be at least 32 characters long.

### 2. Set Environment Variable

Add the encryption key to your environment variables:

**.env.local** (for local development):
```env
PAYMENT_CREDENTIALS_ENCRYPTION_KEY=your-generated-32-plus-character-key-here
```

**Production** (Vercel/Netlify/etc.):
- Go to your hosting platform's environment variables settings
- Add: `PAYMENT_CREDENTIALS_ENCRYPTION_KEY` = `your-generated-key`

**⚠️ CRITICAL**: 
- **Never commit** the encryption key to version control
- **Use different keys** for development, staging, and production
- **Store securely** - if lost, encrypted data cannot be recovered
- **Rotate periodically** (see Key Rotation section below)

### 3. Run Database Migrations

Run the encryption migrations:

```bash
# If using Supabase CLI
supabase migration up

# Or apply manually in Supabase dashboard
# Run: 20250206000001_add_payment_credentials_encryption.sql
# Run: 20250206000002_update_upsert_function_encryption.sql
```

### 4. Verify Setup

1. Check that environment variable is set:
   ```bash
   echo $PAYMENT_CREDENTIALS_ENCRYPTION_KEY
   ```

2. Test encryption/decryption:
   - Try saving payment provider credentials
   - Check database - credentials should be encrypted (long base64 strings)
   - API responses should show masked credentials (****1234)

## How Encryption Works

### Encryption Process

1. **When Saving Credentials**:
   - Admin enters credentials in the UI
   - Credentials sent to API (over HTTPS)
   - API encrypts using `encryptCredential()`
   - Encrypted data stored in database

2. **When Using Credentials**:
   - Payment service retrieves provider config
   - Credentials automatically decrypted using `decryptIfNeeded()`
   - Decrypted credentials used for API calls
   - Credentials never stored in memory longer than needed

### Encryption Algorithm

- **Algorithm**: AES-256-GCM (Authenticated Encryption)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Salt**: Random 64 bytes per encryption
- **IV**: Random 16 bytes per encryption
- **Auth Tag**: 16 bytes for integrity verification

### Security Features

- ✅ **Authenticated Encryption**: Detects tampering
- ✅ **Unique Salt per Encryption**: Same plaintext = different ciphertext
- ✅ **Key Derivation**: Master key not used directly
- ✅ **Backward Compatible**: Handles both encrypted and plaintext (during migration)

## Key Rotation

If you need to rotate the encryption key:

### Option 1: Gradual Rotation (Recommended)

1. **Set new key** in environment: `PAYMENT_CREDENTIALS_ENCRYPTION_KEY_NEW`
2. **Update encryption utility** to support dual keys
3. **Re-encrypt on next update**: When admins update credentials, use new key
4. **Remove old key** after all credentials migrated

### Option 2: Full Re-encryption

1. **Decrypt all credentials** using old key
2. **Re-encrypt** using new key
3. **Update environment variable**
4. **Restart application**

**⚠️ Warning**: Key rotation requires downtime and careful planning.

## Migration from Plaintext

Existing plaintext credentials will be automatically encrypted on next update:

1. **Current State**: Credentials stored as plaintext
2. **On Next Update**: System detects plaintext, encrypts, and stores
3. **Future Reads**: System detects encrypted format, decrypts automatically

**To force immediate encryption**:
- Have admins re-enter their credentials (they'll be encrypted on save)
- Or create a migration script to encrypt all existing credentials

## Troubleshooting

### Error: "PAYMENT_CREDENTIALS_ENCRYPTION_KEY not set"

**Solution**: Set the environment variable in your `.env.local` or hosting platform.

### Error: "Failed to decrypt credential"

**Possible Causes**:
1. Wrong encryption key
2. Corrupted data
3. Data encrypted with different key

**Solution**: 
- Verify encryption key is correct
- Check if data was encrypted with different key
- May need to re-enter credentials

### Credentials Not Encrypting

**Check**:
1. Environment variable is set correctly
2. Application restarted after setting variable
3. Database migration applied
4. Check `credentials_encrypted_at` column in database

### Can't Decrypt Old Credentials

If you changed the encryption key and can't decrypt old data:
- **Option 1**: Restore old key temporarily, migrate data, then use new key
- **Option 2**: Have admins re-enter credentials (they'll be encrypted with new key)

## Security Best Practices

1. ✅ **Never log** encryption keys
2. ✅ **Use different keys** for each environment
3. ✅ **Rotate keys** periodically (every 6-12 months)
4. ✅ **Backup encryption key** securely (password manager, secrets manager)
5. ✅ **Monitor** for decryption failures (may indicate key compromise)
6. ✅ **Use secrets manager** in production (AWS Secrets Manager, Azure Key Vault, etc.)

## Upgrading to External Secrets Manager

To upgrade from environment variables to external secrets manager:

### AWS Secrets Manager Example

```typescript
// src/lib/encryption.ts
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

async function getEncryptionKey(): Promise<string> {
  const client = new SecretsManagerClient({ region: "us-east-1" });
  const command = new GetSecretValueCommand({
    SecretId: "payment-credentials-encryption-key"
  });
  const response = await client.send(command);
  return response.SecretString || '';
}
```

### Benefits

- ✅ Automatic key rotation
- ✅ Audit logging
- ✅ Access control
- ✅ Versioning
- ✅ No keys in environment variables

## API Changes

### GET /api/admin/payment-providers

**Before**: Returns full credentials
```json
{
  "billplz": {
    "billplz_api_key": "sk_live_1234567890abcdef"
  }
}
```

**After**: Returns masked credentials
```json
{
  "billplz": {
    "billplz_api_key": "****cdef"
  }
}
```

### POST/PUT /api/admin/payment-providers

**No change** - Still accepts plaintext credentials, encrypts before storing.

## Database Schema Changes

New columns added:
- `credentials_encrypted_at`: Timestamp when encrypted
- `encryption_version`: Algorithm version (for future upgrades)

## Testing

To test encryption:

1. **Set encryption key** in environment
2. **Save payment provider credentials**
3. **Check database** - should see encrypted (base64) strings
4. **Check API response** - should see masked credentials
5. **Test payment** - should work normally (auto-decrypts)

## Support

For issues or questions:
- Check encryption utility: `src/lib/encryption.ts`
- Review migration files in `supabase/migrations/`
- Check application logs for encryption/decryption errors

---

**Last Updated**: 2025-02-06
**Version**: 1.0

