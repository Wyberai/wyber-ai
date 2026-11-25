#!/usr/bin/env node
// Turns a bounce list (for example the Resend dashboard export: Emails > filter Bounced > Export) into suppressions, using the
// system's own flag, profiles.email_opt_out, so none of these addresses is ever emailed again. Run from the repo root:
//   node scripts/apply-bounce-export.mjs <file.csv>            dry run: counts only, changes nothing
//   node scripts/apply-bounce-export.mjs <file.csv> --apply    sets email_opt_out = true for the matching accounts
// Any text file works: it picks every email address out of it. Addresses are never printed in full.
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const file = process.argv[2]
const apply = process.argv.includes('--apply')
if (!file || file.startsWith('--')) { console.log('Usage: node scripts/apply-bounce-export.mjs <file.csv> [--apply]'); process.exit(1) }
const found = new Set((fs.readFileSync(file, 'utf8').match(/[A-Za-z0-9._%+'-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []).map(e => e.toLowerCase()))
console.log(`Addresses found in the file: ${found.size}`)

async function main() {
  const env = {}
  for (const l of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '') }
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

  let profiles = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin.from('profiles').select('id, email, email_opt_out').range(from, from + 999)
    if (error) { console.log('Could not read profiles:', error.message); { process.exitCode = 1; return } }
    profiles = profiles.concat(data)
    if (data.length < 1000) break
  }
  const matches = profiles.filter(p => p.email && found.has(p.email.toLowerCase()))
  const already = matches.filter(p => p.email_opt_out)
  const toSuppress = matches.filter(p => !p.email_opt_out)
  console.log(`Of those, accounts in your user list: ${matches.length} (already suppressed: ${already.length}, newly suppressed: ${toSuppress.length})`)
  console.log(`Not in your user list (nothing to do): ${found.size - matches.length}`)

  if (!apply) { console.log('\nDRY RUN. Nothing changed. Add --apply to suppress the newly matched accounts.'); return }
  let ok = 0
  for (let i = 0; i < toSuppress.length; i += 100) {
    const ids = toSuppress.slice(i, i + 100).map(p => p.id)
    const { error } = await admin.from('profiles').update({ email_opt_out: true }).in('id', ids)
    if (error) { console.log('Stopped on an error:', error.message); { process.exitCode = 1; return } }
    ok += ids.length
  }
  console.log(`Done. Suppressed ${ok} accounts.`)
}
main().catch(e => { console.log("Failed:", e.message); process.exitCode = 1 })
