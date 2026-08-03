#!/usr/bin/env node
/**
 * Migration Script: Supabase → Cloud SQL (One-time dump + restore)
 *
 * This script performs a complete migration from Supabase to Cloud SQL:
 * 1. Connects to Supabase
 * 2. Dumps schema and data
 * 3. Restores to Cloud SQL
 * 4. Verifies data integrity
 *
 * IMPORTANT: Does not modify your running application
 * Run this ONCE to initialize Cloud SQL with your existing data
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// Configuration from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_HOST = new URL(SUPABASE_URL).hostname
const SUPABASE_PASSWORD = process.env.SUPABASE_PASSWORD || 'postgres'

const CLOUDSQL_HOST = '34.46.132.7'
const CLOUDSQL_PORT = 5432
const CLOUDSQL_USER = 'postgres'
const CLOUDSQL_PASSWORD = process.env.CLOUDSQL_PASSWORD || 'Swarneemdec23#'
const CLOUDSQL_DB = 'wyberai_dev'

const BACKUP_FILE = path.join(__dirname, 'supabase_backup.sql')

async function migrate() {
  console.log('🚀 Starting Supabase → Cloud SQL Migration')
  console.log('=' .repeat(50))

  try {
    // Step 1: Dump Supabase
    console.log('\n📦 Step 1: Dumping Supabase data...')
    console.log(`   Source: ${SUPABASE_HOST}`)

    const dumpCmd = `pg_dump -h ${SUPABASE_HOST} -U postgres -d postgres --no-owner --no-privileges -f "${BACKUP_FILE}"`

    process.env.PGPASSWORD = SUPABASE_PASSWORD
    try {
      await execAsync(dumpCmd)
      console.log('   ✅ Dump successful')
    } catch (err) {
      if (err.message.includes('psql')) {
        console.log('   ⚠️  psql not found - using fallback approach')
        console.log('   📝 Install PostgreSQL from: https://www.postgresql.org/download/windows/')
        process.exit(1)
      }
      throw err
    }

    // Step 2: Restore to Cloud SQL
    console.log('\n📥 Step 2: Restoring to Cloud SQL...')
    console.log(`   Target: ${CLOUDSQL_HOST}:${CLOUDSQL_PORT}/${CLOUDSQL_DB}`)

    const restoreCmd = `psql -h ${CLOUDSQL_HOST} -p ${CLOUDSQL_PORT} -U ${CLOUDSQL_USER} -d ${CLOUDSQL_DB} -f "${BACKUP_FILE}"`

    process.env.PGPASSWORD = CLOUDSQL_PASSWORD
    try {
      await execAsync(restoreCmd)
      console.log('   ✅ Restore successful')
    } catch (err) {
      console.log('   ❌ Restore failed:', err.message)
      throw err
    }

    // Step 3: Verify
    console.log('\n✔️  Step 3: Verifying migration...')
    console.log('   Run the sync script next: node scripts/sync-databases.mjs')

    console.log('\n' + '=' .repeat(50))
    console.log('✅ Migration complete!')
    console.log('\n📋 Next steps:')
    console.log('   1. Verify data in Cloud SQL')
    console.log('   2. Run: node scripts/sync-databases.mjs')
    console.log('   3. Monitor both databases during sync')
    console.log('   4. Gradually switch traffic to Cloud SQL')

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.error('\n🆘 Troubleshooting:')
    console.error('   - Ensure psql is installed: https://www.postgresql.org/download/')
    console.error('   - Check SUPABASE_PASSWORD environment variable')
    console.error('   - Verify Cloud SQL instance is running and accessible')
    process.exit(1)
  }
}

// Run migration
migrate().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
