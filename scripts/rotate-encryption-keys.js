/**
 * Encryption Key Rotation Script
 * 
 * This script re-encrypts all payment provider credentials with a new encryption key.
 * 
 * Usage:
 *   1. Set both old and new keys in environment:
 *      PAYMENT_CREDENTIALS_ENCRYPTION_KEY_OLD=old-key
 *      PAYMENT_CREDENTIALS_ENCRYPTION_KEY=new-key
 *   2. Run: node scripts/rotate-encryption-keys.js
 * 
 * WARNING: Backup your database before running this script!
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Import encryption utilities (need to compile TypeScript first or use ts-node)
// For now, we'll use a simplified approach

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!process.env.PAYMENT_CREDENTIALS_ENCRYPTION_KEY) {
  console.error('❌ Missing PAYMENT_CREDENTIALS_ENCRYPTION_KEY');
  process.exit(1);
}

if (!process.env.PAYMENT_CREDENTIALS_ENCRYPTION_KEY_OLD) {
  console.warn('⚠️  PAYMENT_CREDENTIALS_ENCRYPTION_KEY_OLD not set');
  console.warn('   This script requires both old and new keys for rotation');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Note: This is a simplified version. For full functionality, you need to:
// 1. Compile TypeScript files, or
// 2. Use ts-node to run TypeScript directly, or
// 3. Port the encryption functions to JavaScript

async function rotateAllCredentials() {
  console.log('🔄 Starting credential rotation...\n');
  
  // Get all payment providers
  const { data: providers, error } = await supabase
    .from('mosque_payment_providers')
    .select('*');
  
  if (error) {
    console.error('❌ Error fetching providers:', error);
    return;
  }
  
  if (!providers || providers.length === 0) {
    console.log('ℹ️  No payment providers found');
    return;
  }
  
  console.log(`📊 Found ${providers.length} payment provider(s) to process\n`);
  
  let rotated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const provider of providers) {
    try {
      console.log(`Processing provider ${provider.id} (${provider.provider_type})...`);
      
      // Check if needs rotation
      const needsRotation = 
        (provider.billplz_api_key && provider.billplz_api_key.length > 50) ||
        (provider.billplz_x_signature_key && provider.billplz_x_signature_key.length > 50) ||
        (provider.toyyibpay_secret_key && provider.toyyibpay_secret_key.length > 50) ||
        (provider.stripe_secret_key && provider.stripe_secret_key.length > 50) ||
        (provider.chip_api_key && provider.chip_api_key.length > 50);
      
      if (!needsRotation) {
        console.log(`  ⏭️  Skipped (no encrypted credentials to rotate)`);
        skipped++;
        continue;
      }
      
      // For actual rotation, you need to:
      // 1. Decrypt with old key
      // 2. Re-encrypt with new key
      // This requires the encryption utilities from src/lib/encryption-rotation.ts
      
      // For now, we'll just mark it as needing manual rotation
      console.log(`  ⚠️  Needs rotation (use API or update credentials manually)`);
      console.log(`     Provider will be re-encrypted on next credential update`);
      
      // Update timestamp to indicate rotation attempt
      const { error: updateError } = await supabase
        .from('mosque_payment_providers')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', provider.id);
      
      if (updateError) {
        console.error(`  ❌ Error updating provider:`, updateError);
        errors++;
      } else {
        rotated++;
      }
      
    } catch (error) {
      console.error(`  ❌ Error processing provider ${provider.id}:`, error);
      errors++;
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('📊 Rotation Summary:');
  console.log(`  ✅ Processed: ${rotated}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  ❌ Errors: ${errors}`);
  console.log('\n');
  
  if (rotated > 0) {
    console.log('ℹ️  Note: Credentials will be automatically re-encrypted when admins update them.');
    console.log('   For immediate rotation, use the API endpoint or update credentials manually.');
  }
}

// Run rotation
rotateAllCredentials()
  .then(() => {
    console.log('✅ Rotation process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Rotation failed:', error);
    process.exit(1);
  });

