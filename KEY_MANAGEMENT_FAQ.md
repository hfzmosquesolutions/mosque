# Key Management FAQ

## Q: What happens if I lose the encryption key?

**A: DATA LOSS - All encrypted credentials become unrecoverable.**

- ❌ Cannot decrypt existing encrypted credentials
- ❌ Admins must re-enter their payment provider credentials
- ❌ No way to recover encrypted data without the key

**Prevention**: Always backup your encryption key in multiple secure locations.

---

## Q: How do I update/rotate the encryption key when admins are already using it?

**A: Use gradual rotation (no downtime) or immediate rotation (requires script).**

### Gradual Rotation (Recommended)

1. **Set both keys** in environment:
   ```env
   PAYMENT_CREDENTIALS_ENCRYPTION_KEY_OLD=old-key
   PAYMENT_CREDENTIALS_ENCRYPTION_KEY=new-key
   ```

2. **Restart application** - system automatically:
   - Decrypts with old key (if new key fails)
   - Encrypts new data with new key
   - Re-encrypts on next credential update

3. **Wait for migration** - credentials auto-re-encrypt when admins update them

4. **Remove old key** after all credentials migrated

**No downtime, no admin action needed!**

### Immediate Rotation

1. Set both keys
2. Run rotation script: `node scripts/rotate-encryption-keys.js`
3. Remove old key
4. Restart

See `KEY_ROTATION_GUIDE.md` for detailed steps.

---

## Q: Will admins notice when I rotate the key?

**A: No, if done correctly.**

- System handles decryption/encryption automatically
- Admins don't need to re-enter credentials
- No interruption to payment processing
- Transparent to end users

---

## Q: How often should I rotate the key?

**A: Every 6-12 months, or immediately if compromised.**

Best practices:
- ✅ Regular rotation: 6-12 months
- ✅ Immediate rotation: If key is compromised
- ✅ Rotation on team changes: When people with key access leave
- ✅ Rotation on security incidents

---

## Q: Can I use the same key for dev, staging, and production?

**A: NO - Use different keys for each environment.**

Reasons:
- ✅ Security isolation
- ✅ Prevents accidental data access
- ✅ Allows independent rotation
- ✅ Better security posture

---

## Q: Where should I store the encryption key?

**A: Multiple secure locations (backup strategy).**

Recommended:
1. **Primary**: Environment variables (production)
2. **Backup 1**: Password manager (1Password, LastPass, Bitwarden)
3. **Backup 2**: Secrets manager (AWS Secrets Manager, Azure Key Vault)
4. **Backup 3**: Secure physical storage (vault, safe)

**Never**:
- ❌ Commit to version control
- ❌ Store in plain text files
- ❌ Share via unencrypted email
- ❌ Store in browser bookmarks

---

## Q: What if I accidentally commit the key to Git?

**A: Treat key as compromised and rotate immediately.**

Steps:
1. **Immediately generate new key**
2. **Rotate all credentials** (see rotation guide)
3. **Remove key from Git history** (if possible)
4. **Review access logs** (who had access)
5. **Consider key compromised** - don't reuse

---

## Q: How do I check if rotation is working?

**A: Check database and logs.**

### Database Check

```sql
-- Count encrypted vs not encrypted
SELECT 
  COUNT(*) as total,
  COUNT(credentials_encrypted_at) as encrypted,
  COUNT(*) - COUNT(credentials_encrypted_at) as not_encrypted
FROM mosque_payment_providers;
```

### Application Logs

Look for:
- `Decryption failed with both new and old key` - key mismatch
- `Failed to decrypt with old key, trying new key` - normal during rotation
- `Rotated provider` - from rotation script

---

## Q: Can I rollback if rotation fails?

**A: Yes, if you kept the old key.**

1. Set old key as current:
   ```env
   PAYMENT_CREDENTIALS_ENCRYPTION_KEY=old-key
   ```

2. Remove new key:
   ```env
   # PAYMENT_CREDENTIALS_ENCRYPTION_KEY_NEW=...
   ```

3. Restart application

4. Fix issues before attempting rotation again

---

## Q: What if an admin updates credentials during rotation?

**A: No problem - automatically handled.**

- If credential encrypted with old key → system decrypts with old key, re-encrypts with new key
- If credential encrypted with new key → system uses new key
- Transparent to admin - no action needed

---

## Q: How long does rotation take?

**A: Depends on method.**

- **Gradual rotation**: Days/weeks (as admins update credentials)
- **Immediate rotation**: Minutes (runs script to re-encrypt all at once)

For 100 providers:
- Gradual: ~1-2 weeks (depending on admin activity)
- Immediate: ~5-10 minutes (script execution)

---

## Q: Do I need to notify admins about rotation?

**A: Usually no, but depends on your policy.**

**No notification needed if**:
- Using gradual rotation
- System handles everything automatically
- No interruption to service

**Notify if**:
- Using immediate rotation (may cause brief downtime)
- Key was compromised (security incident)
- Policy requires notification

---

## Q: Can I use AWS Secrets Manager instead of environment variables?

**A: Yes - recommended for production.**

Benefits:
- ✅ Automatic key rotation
- ✅ Audit logging
- ✅ Access control
- ✅ Versioning
- ✅ No keys in environment variables

See `PAYMENT_ENCRYPTION_SETUP.md` for upgrade instructions.

---

## Q: What's the difference between losing the key and rotating the key?

**A: Key difference in recovery.**

| Scenario | Recovery | Admin Impact |
|----------|----------|--------------|
| **Lost Key** | ❌ Cannot recover encrypted data | Must re-enter credentials |
| **Key Rotation** | ✅ Automatic migration | No action needed |

**Key Rotation**: You have both old and new keys → can migrate data
**Lost Key**: You don't have the key → cannot decrypt data

---

## Q: How do I know if credentials are encrypted?

**A: Check database or API response.**

### Database

```sql
-- Encrypted credentials are long base64 strings (>50 chars)
SELECT 
  id,
  provider_type,
  LENGTH(billplz_api_key) as api_key_length,
  credentials_encrypted_at
FROM mosque_payment_providers;
```

Encrypted: `length > 50`, `credentials_encrypted_at IS NOT NULL`
Plaintext: `length < 50`, `credentials_encrypted_at IS NULL`

### API Response

Encrypted credentials in API are masked: `****1234`
Plaintext credentials show full value (security risk!)

---

## Q: Can I encrypt existing plaintext credentials?

**A: Yes - automatic on next update.**

1. **Automatic**: When admin updates credentials, they're encrypted
2. **Manual**: Run rotation script (will encrypt plaintext too)
3. **Force**: Have admins re-enter credentials

---

## Summary

- ✅ **Backup your key** - store in multiple secure locations
- ✅ **Rotate regularly** - every 6-12 months
- ✅ **Use gradual rotation** - no downtime, no admin action
- ✅ **Different keys per environment** - dev, staging, production
- ✅ **Monitor rotation** - check database and logs
- ❌ **Never lose the key** - data becomes unrecoverable

For detailed instructions, see:
- `KEY_ROTATION_GUIDE.md` - Step-by-step rotation guide
- `PAYMENT_ENCRYPTION_SETUP.md` - Initial setup guide

