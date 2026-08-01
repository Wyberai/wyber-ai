#!/usr/bin/env node
/**
 * Seed the WyberCode template library from wybercode-seed-templates/manifest.json.
 *
 * For each manifest entry: reads the local source file, uploads it to GCS via
 * the gcp-bridge /storage/object route (same auth pattern as
 * src/lib/google-cloud-storage.ts), then upserts the wybercode_templates index
 * row (keyed on archetype+framework, so re-running this script updates
 * existing seed rows in place instead of duplicating them).
 *
 * Requires in .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * GCP_BRIDGE_URL, GCP_BRIDGE_SECRET, and optionally WYBERCODE_TEMPLATE_BUCKET
 * (defaults to wyberai-wybercode-templates).
 *
 * Usage: node scripts/seed-wybercode-templates.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { randomUUID } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
dotenv.config({ path: path.join(ROOT, '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BRIDGE_URL = process.env.GCP_BRIDGE_URL
const BRIDGE_SECRET = process.env.GCP_BRIDGE_SECRET
const BUCKET = process.env.WYBERCODE_TEMPLATE_BUCKET || 'wyberai-wybercode-templates'

const missing = []
if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL')
if (!SUPABASE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY')
if (!BRIDGE_URL) missing.push('GCP_BRIDGE_URL')
if (!BRIDGE_SECRET) missing.push('GCP_BRIDGE_SECRET')
if (missing.length) {
  console.error(`❌ Missing required env vars in .env.local: ${missing.join(', ')}`)
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

async function bridgeFetch(urlPath, init) {
  const res = await fetch(`${BRIDGE_URL}${urlPath}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${BRIDGE_SECRET}`, ...(init?.headers || {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || data?.details || `Bridge request failed (${res.status})`)
  return data
}

// archetypeToPagePath — mirrors src/lib/model-providers/wybercode.ts exactly.
// Keep in sync if that function changes.
function archetypeToPagePath(archetype, framework) {
  const name = archetype.split('-').map(w => w[0]?.toUpperCase() + w.slice(1)).join('')
  return framework === 'react-native' ? `screens/${name}Screen.tsx` : `src/pages/${name}.tsx`
}

async function seedOne(entry) {
  const sourcePath = path.join(ROOT, 'wybercode-seed-templates', entry.framework, entry.file)
  const content = readFileSync(sourcePath, 'utf-8')
  const targetPath = archetypeToPagePath(entry.archetype, entry.framework)

  // Reuse an existing row's id (and gcs_path) if this archetype+framework was
  // already seeded, so re-running this script updates in place instead of
  // accumulating duplicate GCS objects / index rows.
  const { data: existing } = await supabase
    .from('wybercode_templates')
    .select('id, gcs_path')
    .eq('archetype', entry.archetype)
    .eq('framework', entry.framework)
    .eq('source', 'seed')
    .maybeSingle()

  const id = existing?.id ?? randomUUID()
  const gcsPath = existing?.gcs_path ?? `${entry.framework}/${entry.archetype}/${id}/`

  await bridgeFetch('/storage/object', {
    method: 'POST',
    body: JSON.stringify({ bucket: BUCKET, path: `${gcsPath}${targetPath}`, content }),
  })

  const row = {
    id,
    archetype: entry.archetype,
    framework: entry.framework,
    description: entry.description,
    gcs_bucket: BUCKET,
    gcs_path: gcsPath,
    wyber_ui_kit_parts: entry.wyberUiKitParts ?? [],
    source: 'seed',
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('wybercode_templates').upsert(row)
  if (error) throw new Error(`DB upsert failed for ${entry.archetype}/${entry.framework}: ${error.message}`)

  console.log(`✅ ${entry.framework}/${entry.archetype} → gs://${BUCKET}/${gcsPath}${targetPath}`)
}

async function main() {
  const manifest = JSON.parse(readFileSync(path.join(ROOT, 'wybercode-seed-templates', 'manifest.json'), 'utf-8'))
  console.log(`Seeding ${manifest.length} template(s) into ${BUCKET}...\n`)
  let failed = 0
  for (const entry of manifest) {
    try {
      await seedOne(entry)
    } catch (e) {
      failed++
      console.error(`❌ ${entry.framework}/${entry.archetype}: ${e.message}`)
    }
  }
  console.log(`\nDone: ${manifest.length - failed}/${manifest.length} succeeded.`)
  if (failed) process.exit(1)
}

main()
