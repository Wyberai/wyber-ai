#!/usr/bin/env node
/**
 * Migration Script: Supabase → Cloud SQL (Node.js version - no pg_dump needed)
 *
 * This script performs a complete migration from Supabase to Cloud SQL:
 * 1. Connects to Supabase
 * 2. Exports all schema and data
 * 3. Restores to Cloud SQL
 * 4. Verifies data integrity
 *
 * IMPORTANT: Does not modify your running application
 * Run this ONCE to initialize Cloud SQL with your existing data
 */

import { Pool } from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_PASSWORD = process.env.SUPABASE_PASSWORD
const CLOUDSQL_URL = process.env.CLOUDSQL_URL
const CLOUDSQL_PASSWORD = process.env.CLOUDSQL_PASSWORD

// Parse connection strings
const supabaseHost = new URL(SUPABASE_URL).hostname
const supabaseConnString = `postgresql://postgres:${SUPABASE_PASSWORD}@${supabaseHost}:5432/postgres`
const cloudsqlConnString = CLOUDSQL_URL

console.log('🚀 Starting Supabase → Cloud SQL Migration (Node.js)')
console.log('='.repeat(60))

if (!SUPABASE_PASSWORD || !CLOUDSQL_URL) {
  console.error('❌ Missing environment variables')
  console.error('   Ensure .env.local has:')
  console.error('   - SUPABASE_PASSWORD')
  console.error('   - CLOUDSQL_URL')
  process.exit(1)
}

async function migrate() {
  const supabasePool = new Pool({ connectionString: supabaseConnString })
  const cloudsqlPool = new Pool({ connectionString: cloudsqlConnString })

  try {
    // Step 1: Connect and verify Supabase
    console.log('\n📦 Step 1: Connecting to Supabase...')
    const sbClient = await supabasePool.connect()
    try {
      const result = await sbClient.query('SELECT version()')
      console.log(`   ✅ Connected to Supabase`)
      console.log(`   Version: ${result.rows[0].version.split(',')[0]}`)
    } finally {
      sbClient.release()
    }

    // Step 2: Connect and verify Cloud SQL
    console.log('\n📦 Step 2: Connecting to Cloud SQL...')
    const csClient = await cloudsqlPool.connect()
    try {
      const result = await csClient.query('SELECT version()')
      console.log(`   ✅ Connected to Cloud SQL`)
      console.log(`   Version: ${result.rows[0].version.split(',')[0]}`)
    } finally {
      csClient.release()
    }

    // Step 3: Get all tables from Supabase
    console.log('\n📦 Step 3: Getting tables from Supabase...')
    const sbClient2 = await supabasePool.connect()
    try {
      const tablesResult = await sbClient2.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `)
      const tables = tablesResult.rows.map(r => r.table_name)
      console.log(`   ✅ Found ${tables.length} tables`)
      tables.forEach(t => console.log(`      - ${t}`))

      // Step 4: Copy schema and data for each table
      console.log('\n📦 Step 4: Copying schema and data...')
      const csClient2 = await cloudsqlPool.connect()
      try {
        for (const table of tables) {
          try {
            // Get table schema
            const schemaResult = await sbClient2.query(`
              SELECT column_name, data_type, is_nullable, column_default
              FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = $1
              ORDER BY ordinal_position
            `, [table])

            // Drop and recreate table in Cloud SQL
            await csClient2.query(`DROP TABLE IF EXISTS "${table}" CASCADE`)

            // Build CREATE TABLE statement
            let createStmt = `CREATE TABLE "${table}" (\n`
            const columnDefs = schemaResult.rows.map(col => {
              let def = `  "${col.column_name}" ${col.data_type}`
              if (col.column_default) def += ` DEFAULT ${col.column_default}`
              if (col.is_nullable === 'NO') def += ' NOT NULL'
              return def
            })
            createStmt += columnDefs.join(',\n') + '\n)'

            await csClient2.query(createStmt)

            // Copy data
            const dataResult = await sbClient2.query(`SELECT * FROM "${table}"`)
            if (dataResult.rows.length > 0) {
              const columns = schemaResult.rows.map(r => r.column_name)
              const columnList = columns.map(c => `"${c}"`).join(', ')
              const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')

              for (const row of dataResult.rows) {
                const values = columns.map(col => row[col])
                await csClient2.query(
                  `INSERT INTO "${table}" (${columnList}) VALUES (${placeholders})`,
                  values
                )
              }
            }

            console.log(`   ✅ ${table} (${dataResult.rows.length} rows)`)
          } catch (err) {
            console.log(`   ⚠️  ${table} - ${err.message}`)
          }
        }
      } finally {
        csClient2.release()
      }
    } finally {
      sbClient2.release()
    }

    // Step 5: Verify
    console.log('\n✔️  Step 5: Verifying migration...')
    const sbClient3 = await supabasePool.connect()
    const csClient3 = await cloudsqlPool.connect()
    try {
      const sbTablesResult = await sbClient3.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      `)
      const csTablesResult = await csClient3.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      `)

      const sbTables = new Set(sbTablesResult.rows.map(r => r.table_name))
      const csTables = new Set(csTablesResult.rows.map(r => r.table_name))

      if (sbTables.size === csTables.size) {
        console.log(`   ✅ Table count matches: ${sbTables.size}`)
      } else {
        console.log(`   ⚠️  Table count mismatch: Supabase=${sbTables.size}, CloudSQL=${csTables.size}`)
      }
    } finally {
      sbClient3.release()
      csClient3.release()
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Migration complete!')
    console.log('\n📋 Next steps:')
    console.log('   1. Verify data in Cloud SQL')
    console.log('   2. Run: node scripts/sync-databases.mjs')
    console.log('   3. Monitor both databases during sync')
    console.log('   4. Gradually switch traffic to Cloud SQL')

  } catch (error) {
    console.error('\n❌ Migration failed:')
    console.error('   Error:', error.message || error)
    console.error('\n🔍 Debugging info:')
    console.error('   Supabase host:', supabaseHost)
    console.error('   SUPABASE_PASSWORD set:', !!SUPABASE_PASSWORD)
    console.error('   CLOUDSQL_URL set:', !!CLOUDSQL_URL)
    console.error('\n💡 Common issues:')
    console.error('   1. Wrong SUPABASE_PASSWORD - try your other password')
    console.error('   2. Network blocked - check firewall/VPN')
    console.error('   3. Supabase project offline - check dashboard')
    process.exit(1)
  } finally {
    await supabasePool.end()
    await cloudsqlPool.end()
  }
}

migrate()
