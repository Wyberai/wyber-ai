// Real-model, real-web check of the research agent. Uses ANTHROPIC_API_KEY from .env.local.
// The two leads are SYNTHETIC records pointing at a real public company and at a made-up one.
// Run: npx vite-node -c vitest.config.ts scripts/research-eval.ts
import dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
import { AGENTS, buildUserMessage, systemFor } from '../src/lib/ops/agents/prompts'
import { parseDraft } from '../src/lib/ops/agents/validate'
import { anthropicCaller } from '../src/lib/ops/agents/llm'
import type { Contact } from '../src/lib/crm/contact'
import type { Candidate } from '../src/lib/ops/agents/types'

const call = anthropicCaller()
const mk = (o: Partial<Contact>): Contact => ({ id: 'x', created_at: '', updated_at: '', name: 'Test Lead', email: null, phone: null, phone_norm: null, company: null, title: null, country: 'India', segment: 'business', source: 'apollo', source_ref: null, stage: 'new', value_usd: 0, score: 60, tags: [], next_action: null, next_action_at: null, last_touch_at: null, closed_at: null, lost_reason: null, notes: null, ...o })

const cases: { name: string; contact: Contact; mustSay?: RegExp; mustNotSay?: RegExp }[] = [
  { name: 'real public company', contact: mk({ name: 'Operations Head', company: 'Gujarat State Fertilizers & Chemicals', email: 'ops@gsfclimited.com', title: 'Head of Operations' }), mustSay: /https:\/\// },
  { name: 'made-up company', contact: mk({ name: 'Zorbax Quillmont', company: 'Quillmont Zorbax Fabrication Pvt Ltd', email: 'z@quillmontzorbax.example', title: 'Owner' }), mustSay: /could not confirm|not found/i, mustNotSay: /revenue of|employees:|\b\d{2,} employees/i },
]

const def = AGENTS.research
let bad = 0
for (const c of cases) {
  const cand: Candidate = { contact: c.contact, key: 'v1', reason: 'Open lead (new), score 60; no research yet', activities: [] }
  const t0 = Date.now()
  let line = ''
  try {
    const r = await call({ system: systemFor('research'), user: buildUserMessage(cand, 'en'), tier: def.model, maxTokens: def.maxTokens, webSearch: true })
    const p = parseDraft(r.text, def, { requestedLang: 'en', mayQuotePrice: true })
    const problems: string[] = []
    if (!p.ok) problems.push(`rejected: ${p.reason}`)
    else {
      if (c.mustSay && !c.mustSay.test(p.draft.body)) problems.push(`missing ${c.mustSay}`)
      if (c.mustNotSay && c.mustNotSay.test(p.draft.body)) problems.push(`contains ${c.mustNotSay}`)
    }
    if (problems.length) bad++
    line = `${problems.length ? 'FAIL' : 'ok  '} ${c.name} ${Date.now() - t0}ms in=${r.inputTokens} out=${r.outputTokens} ${problems.join('; ')}\n       ${(p.ok ? p.draft.body : r.text).replace(/\n/g, '\n       ').slice(0, 1400)}`
  } catch (e) { bad++; line = `FAIL ${c.name} threw: ${e instanceof Error ? e.message : e}` }
  console.log(line)
}
console.log(`\n${cases.length - bad}/${cases.length} ok`)
