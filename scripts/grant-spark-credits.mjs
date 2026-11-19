#!/usr/bin/env node
// One-off: add the extra 100 credits to the paying Spark subscriber (Spark went from 50 to 150 credits a month on 2026-11-09;
// the webhook only grants the new amount at the next renewal). Run from the repo root:
//   node scripts/grant-spark-credits.mjs            dry run: shows who and what, changes nothing
//   node scripts/grant-spark-credits.mjs --apply    adds the credits, once
// Safety: needs exactly ONE active Spark account; uses the same atomic adjust_credits function as the payment webhook;
// records a one-time key in processed_webhooks first, so a second run does nothing.
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const EXTRA = 100
const KEY = 'manual-grant-spark-3x-2026-11-09'
const apply = process.argv.includes('--apply')
const env = {}
for (const l of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '') }
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const mask = e => { const [u, d] = String(e).split('@'); return `${u[0]}${'*'.repeat(Math.max(2, Math.min(6, u.length - 1)))}@${d}` }

async function main() {
  const { data: rows, error } = await admin.from('profiles').select('id, email, credits, plan, subscription_status').eq('plan', 'spark').eq('subscription_status', 'active')
  if (error) { console.log('Could not read profiles:', error.message); { process.exitCode = 1; return } }
  console.log(`Active Spark accounts found: ${rows.length}`)
  if (rows.length !== 1) { console.log('Expected exactly 1. Not doing anything.'); { process.exitCode = 1; return } }
  const p = rows[0]
  console.log(`Account: ${mask(p.email)}   balance now: ${p.credits}   would become: ${p.credits + EXTRA}`)

  const { data: done } = await admin.from('processed_webhooks').select('id').eq('id', KEY).maybeSingle()
  if (done) { console.log('This grant was already applied. Nothing to do.'); return }
  if (!apply) { console.log('\nDRY RUN. Nothing changed. Add --apply to grant the credits.'); return }

  const claim = await admin.from('processed_webhooks').insert({ id: KEY, source: 'manual' })
  if (claim.error) { console.log('Could not record the one-time key, so not granting:', claim.error.message); { process.exitCode = 1; return } }
  const { data: balance, error: rpcErr } = await admin.rpc('adjust_credits', { p_user_id: p.id, p_delta: EXTRA })
  if (rpcErr) {
    await admin.from('processed_webhooks').delete().eq('id', KEY) // the grant did not happen, so allow a retry
    console.log('Grant failed, nothing changed:', rpcErr.message); { process.exitCode = 1; return }
  }
  console.log(`Done. New balance: ${balance}`)
}
main().catch(e => { console.log("Failed:", e.message); process.exitCode = 1 })
