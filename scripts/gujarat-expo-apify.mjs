// Ahmedabad small-team owner leads via Apify (code_crafter/leads-finder, pay-per-lead).
// Usage: node scripts/gujarat-expo-apify.mjs <workdir> <count> <maxSpendUsd>
// Token is read from .env.local (APIFY_TOKEN) and never printed. Raw results go to <workdir>/apify-raw.json.
import fs from 'node:fs'
import path from 'node:path'

const [workdir, count, maxSpend] = process.argv.slice(2)
fs.mkdirSync(workdir, { recursive: true })
let token
for (const l of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^APIFY_TOKEN=(.*)$/)
  if (m) token = m[1].trim()
}
if (!token) throw new Error('APIFY_TOKEN missing in .env.local')

const input = {
  fetch_count: Number(count),
  // City only: the actor treats location and city as either/or, and a country filter overrides the city.
  contact_city: ['ahmedabad'],
  contact_job_title: ['founder', 'co-founder', 'owner', 'proprietor', 'ceo', 'managing director', 'partner'],
  contact_not_job_title: ['assistant', 'intern', 'manager', 'advisor', 'consultant', 'former', 'student', 'retired'],
  seniority_level: ['founder', 'owner', 'c_suite', 'partner'],
  size: ['1-10', '11-20', '21-50'],
  email_status: ['validated'],
  company_not_industry: ['agriculture', 'farming', 'dairy', 'ranching', 'fishery', 'mining & metals', 'food production', 'tobacco'],
  company_not_keywords: ['agriculture', 'agro', 'farm', 'farming', 'dairy', 'fertilizer', 'pesticide', 'seeds', 'poultry', 'mining'],
}

const url = `https://api.apify.com/v2/acts/code_crafter~leads-finder/run-sync-get-dataset-items?token=${token}&maxTotalChargeUsd=${maxSpend}`
const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
const text = await r.text()
if (!r.ok) throw new Error(`${r.status} ${text.slice(0, 300)}`)
const items = JSON.parse(text)
fs.writeFileSync(path.join(workdir, 'apify-raw.json'), JSON.stringify(items, null, 1))
console.log(`status ${r.status}, ${items.length} items, fields: ${Object.keys(items[0] || {}).join(', ')}`)
