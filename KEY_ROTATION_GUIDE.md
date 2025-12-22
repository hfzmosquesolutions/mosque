# Encryption Key Rotation Guide

This guide explains how to handle encryption key rotation and what to do if you lose your encryption key.

## ⚠️ Critical: If You Lose the Key

### **Consequence: DATA LOSS**

If you lose the encryption key **AND** don't have a backup:
- ❌ **All encrypted credentials become unrecoverable**
- ❌ **Admins will need to re-enter their payment provider credentials**
- ❌ **No way to decrypt existing encrypted data**

### **Prevention: Always Backup Your Key**

1. **Store in password manager** (1Password, LastPass, Bitwarden)
2. **Store in secure notes** (encrypted)
3. **Store in secrets manager** (AWS Secrets Manager, Azure Key Vault)
4. **Print and store in secure physical location** (vault, safe)
5. **Share with trusted team members** (with proper access control)

### **If Key is Lost: Recovery Steps**

1. **Check all backup locations** (password manager, secure notes, etc.)
2. **Check version control** (if accidentally committed, rotate immediately!)
3. **Check team members** (someone might have a copy)
4. **If truly lost**: Admins must re-enter credentials (they'll be encrypted with new key)

---

## 🔄 Key Rotation (Updating the Key)

When you need to rotate the encryption key (security best practice, key compromise, etc.):

### **Method 1: Gradual Rotation (Recommended - No Downtime)**

This method allows gradual migration without breaking existing functionality.

#### Step 1: Generate New Key

```bash
# Generate new encryption key
openssl rand -base64 32
```

#### Step 2: Set Both Keys Temporarily

Set **both** old and new keys in environment:

```env
# Old key (for decrypting existing data)
PAYMENT_CREDENTIALS_ENCRYPTION_KEY_OLD=your-old-key-here

# New key (for encrypting new data)
PAYMENT_CREDENTIALS_ENCRYPTION_KEY=your-new-key-here
```

#### Step 3: Restart Application

The system will now:
- ✅ **Decrypt** existing data using old key (if new key fails)
- ✅ **Encrypt** new data using new key
- ✅ **Re-encrypt** on next update (when admins update credentials)

#### Step 4: Gradual Migration

Credentials are automatically re-encrypted when:
- Admin updates payment provider settings
- Admin saves credentials again
- System processes credential updates

**No immediate action needed** - migration happens gradually.

#### Step 5: Force Re-encryption (Optional)

To force immediate re-encryption of all credentials, run the rotation script:

```bash
# Create and run rotation script (see below)
node scripts/rotate-encryption-keys.js
```

#### Step 6: Remove Old Key

After all credentials are migrated (check `credentials_encrypted_at` timestamps):

1. **Verify migration complete**:
   ```sql
   SELECT COUNT(*) FROM mosque_payment_providers 
   WHERE credentials_encrypted_at < NOW() - INTERVAL '1 day';
   -- Should be 0 or very few
   ```

2. **Remove old key** from environment:
   ```env
   # Remove this line
   # PAYMENT_CREDENTIALS_ENCRYPTION_KEY_OLD=...
   
   # Keep only new key
   PAYMENT_CREDENTIALS_ENCRYPTION_KEY=your-new-key-here
   ```

3. **Restart application**

---

### **Method 2: Immediate Rotation (Requires Downtime)**

For immediate rotation of all credentials:

#### Step 1: Generate New Key

```bash
openssl rand -base64 32
```

#### Step 2: Set Both Keys

```env
PAYMENT_CREDENTIALS_ENCRYPTION_KEY_OLD=old-key
PAYMENT_CREDENTIALS_ENCRYPTION_KEY=new-key
```

#### Step 3: Run Rotation Script

Create and run a script to re-encrypt all credentials:

```javascript
// scripts/rotate-encryption-keys.js
const { createClient } = require('@supabase/supabase-js');
const { reencryptProviderCredentials } = require('../src/lib/encryption-rotation');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function rotateAllCredentials() {
  console.log('Starting credential rotation...');
  
  // Get all payment providers
  const { data: providers, error } = await supabase
    .from('mosque_payment_providers')
    .select('*');
  
  if (error) {
    console.error('Error fetching providers:', error);
    return;
  }
  
  console.log(`Found ${providers.length} providers to rotate`);
  
  let rotated = 0;
  let skipped = 0;
  
  for (const provider of providers) {
    try {
      const reencrypted = await reencryptProviderCredentials(provider);
      
      if (reencrypted.reencrypted) {
        // Update in database
        const { error: updateError } = await supabase
          .from('mosque_payment_providers')
          .update({
            billplz_api_key: reencrypted.billplz_api_key,
            billplz_x_signature_key: reencrypted.billplz_x_signature_key,
            toyyibpay_secret_key: reencrypted.toyyibpay_secret_key,
            stripe_secret_key: reencrypted.stripe_secret_key,
            chip_api_key: reencrypted.chip_api_key,
            credentials_encrypted_at: new Date().toISOString(),
            encryption_version: 1,
          })
          .eq('id', provider.id);
        
        if (updateError) {
          console.error(`Error updating provider ${provider.id}:`, updateError);
        } else {
          rotated++;
          console.log(`✅ Rotated provider ${provider.id}`);
        }
      } else {
        skipped++;
        console.log(`⏭️  Skipped provider ${provider.id} (already encrypted with new key)`);
      }
    } catch (error) {
      console.error(`❌ Error rotating provider ${provider.id}:`, error);
    }
  }
  
  console.log(`\nRotation complete!`);
  console.log(`✅ Rotated: ${rotated}`);
  console.log(`⏭️  Skipped: ${skipped}`);
}

rotateAllCredentials();
```

Run the script:

```bash
node scripts/rotate-encryption-keys.js
```

#### Step 4: Remove Old Key

After rotation completes:

```env
# Remove old key
# PAYMENT_CREDENTIALS_ENCRYPTION_KEY_OLD=...

# Keep only new key
PAYMENT_CREDENTIALS_ENCRYPTION_KEY=new-key
```

#### Step 5: Restart Application

---

## 🔍 How to Check Rotation Status

### Check Database

```sql
-- Count providers by encryption status
SELECT 
  COUNT(*) as total,
  COUNT(credentials_encrypted_at) as encrypted,
  COUNT(*) - COUNT(credentials_encrypted_at) as not_encrypted
FROM mosque_payment_providers;

-- Check recent encryption timestamps
SELECT 
  id,
  provider_type,
  credentials_encrypted_at,
  encryption_version
FROM mosque_payment_providers
ORDER BY credentials_encrypted_at DESC NULLS LAST
LIMIT 10;
```

### Check Application Logs

Look for:
- `Decryption failed with both new and old key` - indicates key mismatch
- `Failed to decrypt with old key, trying new key` - normal during rotation
- `Rotated provider` - from rotation script

---

## 🛡️ Best Practices

### 1. **Regular Key Rotation**

- Rotate keys every **6-12 months**
- Rotate immediately if key is compromised
- Rotate when team members with access leave

### 2. **Key Backup Strategy**

- ✅ **Primary**: Environment variables (production)
- ✅ **Backup 1**: Password manager (encrypted)
- ✅ **Backup 2**: Secrets manager (AWS/Azure)
- ✅ **Backup 3**: Secure physical storage (for disaster recovery)

### 3. **Key Access Control**

- Limit who has access to encryption keys
- Use secrets manager with access logging
- Rotate keys when access changes

### 4. **Monitoring**

- Monitor for decryption failures (may indicate key issues)
- Alert on key rotation events
- Track encryption status in database

---

## 🚨 Emergency Procedures

### Scenario 1: Key Compromised

1. **Immediately generate new key**
2. **Set both keys** (old + new)
3. **Run rotation script** to re-encrypt all data
4. **Remove old key** from environment
5. **Notify admins** (they may need to verify credentials)

### Scenario 2: Key Lost (No Backup)

1. **Generate new key**
2. **Set new key** in environment
3. **Notify all admins** to re-enter credentials
4. **Update documentation** about key loss
5. **Review backup procedures**

### Scenario 3: Need to Rollback

If new key causes issues:

1. **Set old key as current**:
   ```env
   PAYMENT_CREDENTIALS_ENCRYPTION_KEY=old-key
   ```

2. **Remove new key**:
   ```env
   # PAYMENT_CREDENTIALS_ENCRYPTION_KEY_NEW=...
   ```

3. **Restart application**

4. **Fix issues** before attempting rotation again

---

## 📋 Rotation Checklist

- [ ] Generate new encryption key (32+ characters)
- [ ] Backup old key securely
- [ ] Set both keys in environment (`PAYMENT_CREDENTIALS_ENCRYPTION_KEY_OLD` + `PAYMENT_CREDENTIALS_ENCRYPTION_KEY`)
- [ ] Restart application
- [ ] Test decryption with old key (verify existing data works)
- [ ] Test encryption with new key (verify new data encrypted)
- [ ] Run rotation script (if immediate rotation needed)
- [ ] Verify all credentials migrated (check database)
- [ ] Remove old key from environment
- [ ] Restart application
- [ ] Verify everything works
- [ ] Update documentation with new key location

---

## 🔧 Troubleshooting

### Error: "Cannot decrypt credential - key mismatch"

**Cause**: Credential encrypted with different key than current

**Solution**:
1. Check if old key is set (`PAYMENT_CREDENTIALS_ENCRYPTION_KEY_OLD`)
2. If not set, set it and restart
3. If still fails, credential may be corrupted or encrypted with unknown key

### Error: "Old encryption key not available"

**Cause**: Trying to decrypt with old key but `PAYMENT_CREDENTIALS_ENCRYPTION_KEY_OLD` not set

**Solution**: Set old key in environment if rotating

### Some Credentials Not Rotating

**Cause**: Credentials not updated since rotation started

**Solution**: 
- Wait for admins to update credentials (auto-re-encrypts)
- Or run rotation script to force immediate rotation

---

## 📞 Support

For issues during key rotation:
1. Check application logs
2. Verify both keys are set correctly
3. Test with single credential first
4. Review this guide
5. Contact system administrator

---

**Last Updated**: 2025-02-06
**Version**: 1.0

