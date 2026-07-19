// Growth Outreach — sends the 1:1 warm-intent emails drafted by
// growth-signals-scan.mjs, via Smartlead. This is the ONE step in the whole
// pipeline that has a real external side effect (an email leaving the
// building), so it's deliberately narrow: a hard daily cap, only rows the
// scan already marked 'queued', and every send logged to stdout for the
// morning digest.
//
// Smartlead is campaign-based (no bare "send one email" endpoint) — this
// script follows the "create once, run many" pattern: the first run creates
// a persistent campaign + sequence + attaches a warmed sending account, and
// prints a SMARTLEAD_CAMPAIGN_ID to save into .env.local. Every run after
// that just adds queued leads to the existing campaign.
//
// Usage:
//   node scripts/growth-outreach-send.mjs                # send up to the daily cap
//   node scripts/growth-outreach-send.mjs --dry-run       # show who would be emailed, send nothing
//   node scripts/growth-outreach-send.mjs --daily-cap=5   # override the cap (default 5)
//   node scripts/growth-outreach-send.mjs --setup         # force one-time campaign setup, print the ID, exit
//   node scripts/growth-outreach-send.mjs --test-lead=you@example.com  # add ONLY this address, ignore growth_signals

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=')
  return [k, v ?? true]
}))
const DRY_RUN = !!args['dry-run']
const DAILY_CAP = Number(args['daily-cap'] ?? 5)
const FORCE_SETUP = !!args.setup
const TEST_LEAD = args['test-lead'] || null

const SL_BASE = 'https://server.smartlead.ai/api/v1'
const SL_KEY = process.env.SMARTLEAD_API_KEY
if (!SL_KEY) { console.error('SMARTLEAD_API_KEY missing from .env.local'); process.exit(1) }

async function sl(path, method = 'GET', body) {
  const url = `${SL_BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${SL_KEY}`
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = text }
  if (!res.ok) throw new Error(`Smartlead ${method} ${path} → ${res.status}: ${typeof json === 'string' ? json.slice(0, 300) : JSON.stringify(json).slice(0, 300)}`)
  return json
}

// ── one-time campaign setup ─────────────────────────────────────────────
async function ensureCampaign() {
  if (process.env.SMARTLEAD_CAMPAIGN_ID && !FORCE_SETUP) return process.env.SMARTLEAD_CAMPAIGN_ID

  console.log('› no SMARTLEAD_CAMPAIGN_ID found — running one-time setup\n')

  console.log('1. creating campaign…')
  const created = await sl('/campaigns/create', 'POST', {
    name: 'WyberAi Warm Intent Outreach',
    track_settings: { track_open: true, track_click: true },
  })
  console.log('   ' + JSON.stringify(created))
  const campaignId = created?.id ?? created?.campaign?.id
  if (!campaignId) throw new Error('campaign create did not return an id — inspect the response above')

  console.log('\n2. listing email accounts to find a warmed sender…')
  const accounts = await sl('/email-accounts')
  console.log('   ' + JSON.stringify(accounts).slice(0, 500))
  const list = Array.isArray(accounts) ? accounts : accounts?.email_accounts || []
  const warmed = list.find(a => (a.warmup_details?.status === 'ACTIVE' || a.warmup_enabled) && (a.warmup_details?.warmup_reputation ?? 0) >= 0) || list[0]
  if (!warmed) throw new Error('no email accounts found in this Smartlead account — add and warm one in the dashboard first')
  console.log(`   using account: ${warmed.from_email || warmed.email || warmed.id}`)

  console.log('\n3. attaching sending account…')
  console.log('   ' + JSON.stringify(await sl(`/campaigns/${campaignId}/email-accounts`, 'POST', { email_account_ids: [warmed.id] })))

  console.log('\n4. configuring one-step sequence…')
  console.log('   ' + JSON.stringify(await sl(`/campaigns/${campaignId}/sequences`, 'POST', {
    sequences: [{
      seq_number: 1,
      subject: 'a quick note about your build',
      email_body: `Hi {{first_name}},<br><br>{{personalization}}<br><br>No pressure either way — just wanted to flag it in case you'd stalled on something small.<br><br>Sumeet<br>WyberAi`,
      seq_delay_details: { delay_in_days: 0 },
    }],
  })))

  console.log('\n5. activating campaign…')
  console.log('   ' + JSON.stringify(await sl(`/campaigns/${campaignId}/status`, 'POST', { status: 'ACTIVE' })))

  console.log(`\n✓ setup complete. Add this to .env.local:\n\nSMARTLEAD_CAMPAIGN_ID=${campaignId}\n`)
  return campaignId
}

// ── per-run send ─────────────────────────────────────────────────────────
async function addLead(campaignId, lead) {
  return sl(`/campaigns/${campaignId}/leads`, 'POST', {
    leads: [{
      first_name: lead.first_name || null,
      email: lead.email,
      custom_fields: { personalization: lead.personalization },
    }],
  })
}

async function main() {
  const campaignId = await ensureCampaign()
  if (FORCE_SETUP) return // --setup: print the ID and stop, don't send anything this run

  if (TEST_LEAD) {
    console.log(`\n› test mode — adding ONLY ${TEST_LEAD}, ignoring growth_signals\n`)
    const lead = { email: TEST_LEAD, first_name: null, personalization: 'This is a test send from the growth-outreach-send.mjs setup — if you got this, the pipeline works end to end.' }
    if (DRY_RUN) { console.log('  (dry-run) would add:', JSON.stringify(lead)); return }
    console.log('  ' + JSON.stringify(await addLead(campaignId, lead)))
    console.log('\n✓ test lead added — check the Smartlead dashboard and the inbox.')
    return
  }

  const { data: queued, error } = await sb
    .from('growth_signals')
    .select('id, person_identifier, person_name, drafted_response')
    .eq('segment', 'stuck_rescue')
    .eq('status', 'queued')
    .not('drafted_response', 'is', null)
    .order('intent_score', { ascending: false })
    .limit(DAILY_CAP)
  if (error) throw new Error('select queued: ' + error.message)

  console.log(`\n› ${queued.length} lead(s) queued and ready (cap ${DAILY_CAP})${DRY_RUN ? ' — DRY RUN, sending nothing' : ''}\n`)

  let sent = 0
  for (const row of queued) {
    const firstName = row.person_name ? row.person_name.split(' ')[0] : null
    console.log(`  · ${row.person_identifier}`)
    console.log(`    "${row.drafted_response}"`)
    if (DRY_RUN) continue
    try {
      await addLead(campaignId, { email: row.person_identifier, first_name: firstName, personalization: row.drafted_response })
      await sb.from('growth_signals').update({ status: 'actioned', actioned_at: new Date().toISOString() }).eq('id', row.id)
      sent++
    } catch (e) {
      console.warn(`    ! send failed: ${e.message}`)
    }
  }

  console.log(`\n── summary ──`)
  console.log(`sent: ${sent}${DRY_RUN ? ' (dry-run)' : ''} / cap ${DAILY_CAP}`)
  console.log('Done.\n')
}

await main()
