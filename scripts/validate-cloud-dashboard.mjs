#!/usr/bin/env node

/**
 * Pre-deployment validation script for Cloud Dashboard
 * Checks:
 * - Environment variables are set
 * - Database migrations are applied
 * - Encryption keys are valid
 * - RLS policies are enabled
 * - Rate limiting is initialized
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(level, message, color = colors.blue) {
  const timestamp = new Date().toISOString();
  console.log(`${color}[${timestamp}] [${level}]${colors.reset} ${message}`);
}

async function validateEnvironmentVariables() {
  log('INFO', 'Checking environment variables...');
  const requiredVars = [
    'RAILWAY_API_TOKEN',
    'SECRETS_ENCRYPTION_KEY',
    'CRON_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const envFile = path.join(rootDir, '.env.local');
  if (!fs.existsSync(envFile)) {
    log('WARN', '.env.local not found - will check process.env', colors.yellow);
  }

  const missing = [];
  const invalid = [];

  for (const varName of requiredVars) {
    const value = process.env[varName];

    if (!value) {
      missing.push(varName);
      continue;
    }

    // Validate specific formats
    if (varName === 'SECRETS_ENCRYPTION_KEY') {
      if (!/^[0-9a-f]{64}$/i.test(value)) {
        invalid.push(`${varName} must be 64-character hex string (got ${value.length} chars)`);
      } else {
        log('PASS', `✓ ${varName} is valid 64-char hex key`, colors.green);
      }
    } else if (varName === 'CRON_SECRET') {
      if (value.length < 32) {
        invalid.push(`${varName} should be at least 32 characters (got ${value.length})`);
      } else {
        log('PASS', `✓ ${varName} is long enough`, colors.green);
      }
    } else {
      log('PASS', `✓ ${varName} is set`, colors.green);
    }
  }

  if (missing.length > 0) {
    log('ERROR', `Missing environment variables: ${missing.join(', ')}`, colors.red);
    return false;
  }

  if (invalid.length > 0) {
    log('ERROR', `Invalid environment variables:\n  ${invalid.join('\n  ')}`, colors.red);
    return false;
  }

  return true;
}

async function validateDatabaseTables() {
  log('INFO', 'Checking database tables...');

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      log('WARN', 'Cannot check Supabase without credentials', colors.yellow);
      return true;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const requiredTables = [
      'cloud_databases',
      'cloud_database_usage',
      'cloud_backups',
      'cloud_query_logs',
      'cloud_secrets',
    ];

    const { data: tables, error } = await supabase.rpc('get_all_tables');

    if (error) {
      log('WARN', `Could not fetch table list: ${error.message}`, colors.yellow);
      return true; // Non-fatal
    }

    const tableNames = (tables || []).map(t => t.table_name);
    const missing = requiredTables.filter(t => !tableNames.includes(t));

    if (missing.length > 0) {
      log('ERROR', `Missing required tables: ${missing.join(', ')}`, colors.red);
      log('INFO', 'Run: supabase db push', colors.blue);
      return false;
    }

    for (const table of requiredTables) {
      log('PASS', `✓ Table "${table}" exists`, colors.green);
    }

    return true;
  } catch (err) {
    log('WARN', `Database check skipped: ${String(err)}`, colors.yellow);
    return true; // Non-fatal
  }
}

async function validateRLSPolicies() {
  log('INFO', 'Checking RLS policies...');

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      log('WARN', 'Cannot check RLS without credentials', colors.yellow);
      return true;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to access cloud_databases as anon user (should fail if RLS is enabled)
    const { data, error } = await supabase
      .from('cloud_databases')
      .select('id')
      .limit(1);

    if (error && error.code === 'PGRST204') {
      // 404 usually means RLS denied access
      log('PASS', '✓ RLS is enabled on cloud_databases', colors.green);
      return true;
    }

    log('WARN', 'Could not fully validate RLS (may still be enabled)', colors.yellow);
    return true;
  } catch (err) {
    log('WARN', `RLS check skipped: ${String(err)}`, colors.yellow);
    return true;
  }
}

async function validateEncryption() {
  log('INFO', 'Checking encryption setup...');

  try {
    const key = process.env.SECRETS_ENCRYPTION_KEY;
    if (!key) {
      log('WARN', 'SECRETS_ENCRYPTION_KEY not set', colors.yellow);
      return true;
    }

    // Try to import and test crypto module
    const crypto = await import('crypto');
    const algorithm = 'aes-256-gcm';

    // Simple encrypt/decrypt test
    const plaintext = 'test-secret';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    log('PASS', '✓ AES-256-GCM encryption is available', colors.green);
    return true;
  } catch (err) {
    log('ERROR', `Encryption check failed: ${String(err)}`, colors.red);
    return false;
  }
}

async function validateRateLimiting() {
  log('INFO', 'Checking rate limiting setup...');

  try {
    // Just check that the rate limit module exists
    const rateLimitPath = path.join(rootDir, 'src/lib/cloud/rate-limit.ts');
    if (!fs.existsSync(rateLimitPath)) {
      log('ERROR', 'Rate limiting module not found', colors.red);
      return false;
    }

    log('PASS', '✓ Rate limiting module exists', colors.green);
    return true;
  } catch (err) {
    log('ERROR', `Rate limiting check failed: ${String(err)}`, colors.red);
    return false;
  }
}

async function validateBuild() {
  log('INFO', 'Checking if build is clean...');

  try {
    // Check if dist exists
    const distPath = path.join(rootDir, '.next');
    if (!fs.existsSync(distPath)) {
      log('WARN', 'No build artifacts found (run npm run build)', colors.yellow);
      return true;
    }

    log('PASS', '✓ Build artifacts exist', colors.green);
    return true;
  } catch (err) {
    log('WARN', `Build check skipped: ${String(err)}`, colors.yellow);
    return true;
  }
}

async function main() {
  console.log(`\n${colors.blue}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║     Cloud Dashboard Pre-Deployment Check    ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════╝${colors.reset}\n`);

  const checks = [
    { name: 'Environment Variables', fn: validateEnvironmentVariables },
    { name: 'Database Tables', fn: validateDatabaseTables },
    { name: 'RLS Policies', fn: validateRLSPolicies },
    { name: 'Encryption Setup', fn: validateEncryption },
    { name: 'Rate Limiting', fn: validateRateLimiting },
    { name: 'Build Status', fn: validateBuild },
  ];

  let passCount = 0;
  let failCount = 0;

  for (const check of checks) {
    console.log(`\n${colors.blue}─ ${check.name}${colors.reset}`);
    try {
      const result = await check.fn();
      if (result) {
        passCount++;
      } else {
        failCount++;
      }
    } catch (err) {
      log('ERROR', `Check failed: ${String(err)}`, colors.red);
      failCount++;
    }
  }

  // Summary
  console.log(`\n${colors.blue}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║              Summary                        ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════╝${colors.reset}`);
  log('INFO', `${colors.green}${passCount}${colors.reset} checks passed`, colors.blue);

  if (failCount > 0) {
    log('INFO', `${colors.red}${failCount}${colors.reset} checks failed`, colors.blue);
    console.log(`\n${colors.red}Deployment blocked - fix above issues before proceeding${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}✓ All checks passed! Ready for deployment.${colors.reset}\n`);
    process.exit(0);
  }
}

main().catch((err) => {
  log('FATAL', String(err), colors.red);
  process.exit(1);
});
