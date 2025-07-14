#!/usr/bin/env node

/**
 * Authentication System Migration Script
 * 
 * This script helps migrate from the old authentication system to the new one.
 * It creates backups of existing files and replaces them with the new versions.
 * 
 * Usage: node migrate-auth.js [--dry-run] [--rollback]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  srcDir: './src',
  backupSuffix: '.backup',
  newSuffix: '.v2',
};

// Files to migrate
const MIGRATION_MAP = {
  'contexts/AuthContext.tsx': 'contexts/AuthContext.v2.tsx',
  'services/auth.ts': 'services/auth.v2.ts',
  'hooks/useAuth.ts': 'hooks/useAuth.v2.ts',
  'components/guards/AuthGuard.tsx': 'components/guards/AuthGuard.v2.tsx',
};

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isRollback = args.includes('--rollback');
const isForce = args.includes('--force');

// Utility functions
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'     // Reset
  };
  
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function createBackup(filePath) {
  const backupPath = filePath + CONFIG.backupSuffix;
  
  if (fileExists(filePath)) {
    if (fileExists(backupPath) && !isForce) {
      log(`Backup already exists: ${backupPath}`, 'warning');
      return false;
    }
    
    if (!isDryRun) {
      fs.copyFileSync(filePath, backupPath);
    }
    log(`Created backup: ${backupPath}`, 'success');
    return true;
  }
  
  return false;
}

function restoreBackup(filePath) {
  const backupPath = filePath + CONFIG.backupSuffix;
  
  if (fileExists(backupPath)) {
    if (!isDryRun) {
      fs.copyFileSync(backupPath, filePath);
      fs.unlinkSync(backupPath);
    }
    log(`Restored backup: ${filePath}`, 'success');
    return true;
  }
  
  log(`No backup found: ${backupPath}`, 'warning');
  return false;
}

function replaceFile(oldPath, newPath) {
  if (!fileExists(newPath)) {
    log(`New file not found: ${newPath}`, 'error');
    return false;
  }
  
  if (!isDryRun) {
    fs.copyFileSync(newPath, oldPath);
  }
  log(`Replaced: ${oldPath} with ${newPath}`, 'success');
  return true;
}

function updateImports() {
  const filesToUpdate = [
    'app/layout.tsx',
    'components/**/*.tsx',
    'pages/**/*.tsx',
    'hooks/**/*.ts',
  ];
  
  const importReplacements = {
    "from '@/contexts/AuthContext'": "from '@/contexts/AuthContext.v2'",
    "from '@/services/auth'": "from '@/services/auth.v2'",
    "from '@/hooks/useAuth'": "from '@/hooks/useAuth.v2'",
    "from '@/components/guards/AuthGuard'": "from '@/components/guards/AuthGuard.v2'",
  };
  
  log('\nUpdating imports...', 'info');
  
  if (isDryRun) {
    log('Would update imports in:', 'info');
    filesToUpdate.forEach(pattern => log(`  - ${pattern}`, 'info'));
    return;
  }
  
  try {
    // Use find and sed to update imports
    Object.entries(importReplacements).forEach(([oldImport, newImport]) => {
      const command = `find ${CONFIG.srcDir} -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|${oldImport}|${newImport}|g'`;
      execSync(command, { stdio: 'pipe' });
    });
    
    log('Updated imports successfully', 'success');
  } catch (error) {
    log(`Error updating imports: ${error.message}`, 'error');
  }
}

function rollbackImports() {
  const importReplacements = {
    "from '@/contexts/AuthContext.v2'": "from '@/contexts/AuthContext'",
    "from '@/services/auth.v2'": "from '@/services/auth'",
    "from '@/hooks/useAuth.v2'": "from '@/hooks/useAuth'",
    "from '@/components/guards/AuthGuard.v2'": "from '@/components/guards/AuthGuard'",
  };
  
  log('\nRolling back imports...', 'info');
  
  if (isDryRun) {
    log('Would rollback imports', 'info');
    return;
  }
  
  try {
    Object.entries(importReplacements).forEach(([oldImport, newImport]) => {
      const command = `find ${CONFIG.srcDir} -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|${oldImport}|${newImport}|g'`;
      execSync(command, { stdio: 'pipe' });
    });
    
    log('Rolled back imports successfully', 'success');
  } catch (error) {
    log(`Error rolling back imports: ${error.message}`, 'error');
  }
}

function performMigration() {
  log('🚀 Starting Authentication System Migration', 'info');
  
  if (isDryRun) {
    log('\n📋 DRY RUN MODE - No files will be modified', 'warning');
  }
  
  let success = true;
  
  // Step 1: Create backups and replace files
  log('\n📁 Step 1: Backing up and replacing files...', 'info');
  
  Object.entries(MIGRATION_MAP).forEach(([oldFile, newFile]) => {
    const oldPath = path.join(CONFIG.srcDir, oldFile);
    const newPath = path.join(CONFIG.srcDir, newFile);
    
    log(`\nProcessing: ${oldFile}`, 'info');
    
    // Create backup if file exists
    if (fileExists(oldPath)) {
      createBackup(oldPath);
      
      // Replace with new file
      if (!replaceFile(oldPath, newPath)) {
        success = false;
      }
    } else {
      log(`Original file not found: ${oldPath}`, 'warning');
      
      // Copy new file if original doesn't exist
      if (fileExists(newPath)) {
        if (!isDryRun) {
          fs.copyFileSync(newPath, oldPath);
        }
        log(`Created new file: ${oldPath}`, 'success');
      }
    }
  });
  
  // Step 2: Update imports
  updateImports();
  
  // Step 3: Summary
  log('\n📊 Migration Summary:', 'info');
  
  if (success) {
    log('✅ Migration completed successfully!', 'success');
    log('\n📝 Next steps:', 'info');
    log('1. Test your application thoroughly', 'info');
    log('2. Update any custom authentication logic', 'info');
    log('3. Review the AUTHENTICATION_UPGRADE_GUIDE.md for detailed changes', 'info');
    log('4. Run your test suite to ensure everything works', 'info');
    
    if (!isDryRun) {
      log('\n🔄 To rollback: node migrate-auth.js --rollback', 'info');
    }
  } else {
    log('❌ Migration completed with errors', 'error');
    log('Please review the errors above and fix them before proceeding', 'error');
  }
}

function performRollback() {
  log('🔄 Starting Authentication System Rollback', 'info');
  
  if (isDryRun) {
    log('\n📋 DRY RUN MODE - No files will be modified', 'warning');
  }
  
  let success = true;
  
  // Step 1: Restore backups
  log('\n📁 Step 1: Restoring backup files...', 'info');
  
  Object.keys(MIGRATION_MAP).forEach(oldFile => {
    const oldPath = path.join(CONFIG.srcDir, oldFile);
    
    log(`\nRestoring: ${oldFile}`, 'info');
    
    if (!restoreBackup(oldPath)) {
      success = false;
    }
  });
  
  // Step 2: Rollback imports
  rollbackImports();
  
  // Step 3: Summary
  log('\n📊 Rollback Summary:', 'info');
  
  if (success) {
    log('✅ Rollback completed successfully!', 'success');
    log('Your authentication system has been restored to the previous version', 'info');
  } else {
    log('❌ Rollback completed with errors', 'error');
    log('Some files may need to be restored manually', 'error');
  }
}

function showHelp() {
  log('Authentication System Migration Script', 'info');
  log('\nUsage:', 'info');
  log('  node migrate-auth.js [options]', 'info');
  log('\nOptions:', 'info');
  log('  --dry-run    Show what would be done without making changes', 'info');
  log('  --rollback   Restore the previous authentication system', 'info');
  log('  --force      Overwrite existing backups', 'info');
  log('  --help       Show this help message', 'info');
  log('\nExamples:', 'info');
  log('  node migrate-auth.js --dry-run    # Preview migration', 'info');
  log('  node migrate-auth.js              # Perform migration', 'info');
  log('  node migrate-auth.js --rollback   # Rollback migration', 'info');
}

// Main execution
function main() {
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  // Check if we're in the right directory
  if (!fileExists('package.json') || !fileExists(CONFIG.srcDir)) {
    log('❌ Error: This script must be run from the project root directory', 'error');
    log('Make sure you have package.json and src/ directory', 'error');
    process.exit(1);
  }
  
  if (isRollback) {
    performRollback();
  } else {
    performMigration();
  }
}

// Run the script
main();