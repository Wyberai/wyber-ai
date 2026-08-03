#!/usr/bin/env node
/**
 * Alternative Migration: Use Supabase API + Cloud SQL direct connection
 *
 * This avoids the network timeout by using Supabase's REST API
 * to export data instead of direct Postgres connection.
 */

import { createClient } from '@supabase/supabase-js'
import { Pool } from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const CLOUDSQL_URL = process.env.CLOUDSQL_URL

console.log('🚀 Starting Migration (Supabase API → Cloud SQL)')
console.log('='.repeat(60))

if (!SUPABASE_URL || !SUPABASE_KEY || !CLOUDSQL_URL) {
  console.error('❌ Missing environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('   - CLOUDSQL_URL')
  process.exit(1)
}

async function migrate() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
  })

  const cloudsqlPool = new Pool({ connectionString: CLOUDSQL_URL })

  try {
    // Step 1: Get list of tables from Supabase
    console.log('\n📦 Step 1: Getting tables from Supabase...')

    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE')

    if (tablesError || !tables) {
      throw new Error(`Failed to get tables: ${tablesError?.message}`)
    }

    console.log(`   ✅ Found ${tables.length} tables`)

    // Step 2: Connect to Cloud SQL
    console.log('\n📦 Step 2: Connecting to Cloud SQL...')
    const csClient = await cloudsqlPool.connect()
    try {
      const versionResult = await csClient.query('SELECT version()')
      console.log(`   ✅ Connected to Cloud SQL`)
    } finally {
      csClient.release()
    }

    // Step 3: For each table, export and import data
    console.log('\n📦 Step 3: Migrating tables...')

    const allTables = [
      'users', 'user_profiles', 'projects', 'project_connectors',
      'supabase_projects', 'deployments', 'templates', 'prompt_responses',
      'usage_logs', 'prompts', 'api_keys', 'invitations',
      'team_members', 'organizations', 'workspace_settings',
      'audit_logs', 'webhooks', 'api_logs', 'email_logs',
      'feature_flags', 'content_blocks', 'datasources'
      // Add more as needed
    ]

    let migratedCount = 0

    for (const table of allTables) {
      try {
        // Get data from Supabase via REST API
        const { data: records, error: fetchError } = await supabase
          .from(table)
          .select('*')
          .limit(10000) // Fetch in batches if needed

        if (fetchError) {
          console.log(`   ⏭️  ${table} - skipped (not found or error)`)
          continue
        }

        if (!records || records.length === 0) {
          console.log(`   ℹ️  ${table} - empty`)
          migratedCount++
          continue
        }

        // Insert into Cloud SQL
        const csClient2 = await cloudsqlPool.connect()
        try {
          // Truncate table first
          await csClient2.query(`TRUNCATE TABLE "${table}" CASCADE`)

          // Insert records
          const keys = Object.keys(records[0])
          const columns = keys.map(k => `"${k}"`).join(', ')

          for (const record of records) {
            const values = keys.map((k, i) => record[k])
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')

            await csClient2.query(
              `INSERT INTO "${table}" (${columns}) VALUES (${placeholders})`,
              values
            )
          }

          console.log(`   ✅ ${table} (${records.length} rows)`)
          migratedCount++
        } finally {
          csClient2.release()
        }

      } catch (err) {
        console.log(`   ⚠️  ${table} - ${err.message}`)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`✅ Migration complete! (${migratedCount}/${allTables.length} tables)`)
    console.log('\n📋 Next steps:')
    console.log('   1. Verify data in Cloud SQL')
    console.log('   2. Run: node scripts/sync-databases.mjs')
    console.log('   3. Test your app against Cloud SQL')

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message || error)
    process.exit(1)
  } finally {
    await cloudsqlPool.end()
  }
}

migrate()
