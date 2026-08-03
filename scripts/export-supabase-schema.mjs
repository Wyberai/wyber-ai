#!/usr/bin/env node
/**
 * Export Supabase Schema to SQL file
 *
 * Reads schema from Supabase information_schema
 * Generates CREATE TABLE statements for all tables
 * Outputs to a file that can be imported into Cloud SQL
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('📋 Exporting Supabase schema...\n')

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
})

async function exportSchema() {
  try {
    // Get all tables
    console.log('📦 Reading table list...')
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE')

    console.log(`   Found ${tables.length} tables\n`)

    let sqlOutput = '-- Supabase Schema Export\n'
    sqlOutput += `-- Exported: ${new Date().toISOString()}\n`
    sqlOutput += '-- Tables: ' + tables.length + '\n\n'

    // For each table, get its CREATE statement
    for (const { table_name } of tables) {
      try {
        console.log(`📝 Reading: ${table_name}`)

        // Get columns
        const { data: columns } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_schema', 'public')
          .eq('table_name', table_name)
          .order('ordinal_position', { ascending: true })

        // Get constraints
        const { data: constraints } = await supabase
          .from('information_schema.table_constraints')
          .select('constraint_type, constraint_name')
          .eq('table_schema', 'public')
          .eq('table_name', table_name)

        // Get key column usage for foreign keys
        const { data: keyUsage } = await supabase
          .from('information_schema.key_column_usage')
          .select('column_name, referenced_table_name, referenced_column_name')
          .eq('table_schema', 'public')
          .eq('table_name', table_name)

        // Build CREATE TABLE statement
        let createStmt = `\nCREATE TABLE IF NOT EXISTS "${table_name}" (\n`

        const columnDefs = columns.map((col, idx) => {
          let def = `  "${col.column_name}" ${col.data_type}`

          if (col.column_default) {
            def += ` DEFAULT ${col.column_default}`
          }

          if (col.is_nullable === 'NO') {
            def += ' NOT NULL'
          }

          // Check if this column is a foreign key
          const fk = keyUsage?.find(k => k.column_name === col.column_name && k.referenced_table_name)
          if (fk) {
            def += ` REFERENCES "${fk.referenced_table_name}"("${fk.referenced_column_name}")`
          }

          return def
        })

        createStmt += columnDefs.join(',\n') + '\n);\n'

        sqlOutput += createStmt

        // Add indexes
        const { data: indexes } = await supabase
          .from('information_schema.statistics')
          .select('index_name, column_name, seq_in_index')
          .eq('table_schema', 'public')
          .eq('table_name', table_name)
          .neq('index_name', 'PRIMARY')

        if (indexes && indexes.length > 0) {
          const uniqueIndexes = new Set(indexes.map(i => i.index_name))
          for (const indexName of uniqueIndexes) {
            const indexCols = indexes
              .filter(i => i.index_name === indexName)
              .sort((a, b) => a.seq_in_index - b.seq_in_index)
              .map(i => `"${i.column_name}"`)
              .join(', ')

            sqlOutput += `CREATE INDEX IF NOT EXISTS "${indexName}" ON "${table_name}" (${indexCols});\n`
          }
        }

      } catch (err) {
        console.log(`   ⚠️  Error reading ${table_name}: ${err.message}`)
      }
    }

    // Write to file
    const outputPath = path.join(__dirname, 'supabase_schema.sql')
    fs.writeFileSync(outputPath, sqlOutput)

    console.log(`\n✅ Schema exported to: ${outputPath}`)
    console.log(`\n📋 Next steps:`)
    console.log(`   1. Open Cloud SQL SQL console`)
    console.log(`   2. Copy contents of supabase_schema.sql`)
    console.log(`   3. Paste and run in Cloud SQL`)
    console.log(`   4. Verify all tables created`)

  } catch (error) {
    console.error('❌ Export failed:', error.message)
    process.exit(1)
  }
}

exportSchema()
