// One-off experiment for the parked fill-batch-concurrency work (see
// AGENTS.md history / prior session notes). Last time concurrent fill
// batches were tried under real Opus load, 2 of 7 concurrent batches came
// back with no content and no thrown error — root cause was never
// confirmed (rate-limiting vs. something in our own dispatch code).
//
// This isolates the question at the raw Anthropic SDK level, on Sonnet
// (cheap, and NOT the tier that showed the problem) — no Supabase, no
// credits, no route.ts involved. If concurrent Sonnet calls also drop
// content, the bug is in how we dispatch/consume concurrent streams and
// would hit any tier. If Sonnet is clean, that points at Opus-tier
// rate-limiting/account concurrency limits specifically.
//
// Usage: node scripts/_verify-concurrent-fill-sonnet.mjs [trials]
import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-5'
const BATCH_COUNT = 7 // matches the real "7 concurrent batches" case from last session
const TRIALS = Number(process.argv[2] || 5)

// Shaped like a real fill-batch request: 2-3 small named files, modest
// budget. Kept intentionally cheap (not the full 24k-token production
// budget) since this only needs to exercise concurrent dispatch/streaming,
// not reproduce full build cost.
function buildPrompt(batchIndex) {
  return {
    system: `You are writing ${2} small React components for batch #${batchIndex} of a web app fill pass. Output each file as:\n<file path="src/components/Batch${batchIndex}A.tsx">\n...content...\n</file>\n<file path="src/components/Batch${batchIndex}B.tsx">\n...content...\n</file>\nKeep each file under 40 lines. No prose outside the file tags.`,
    messages: [{ role: 'user', content: `Batch ${batchIndex}: build a simple stat card component and a simple list component, on-brand for a generic SaaS dashboard.` }],
  }
}

async function runOne(batchIndex) {
  const { system, messages } = buildPrompt(batchIndex)
  const start = Date.now()
  try {
    const stream = await client.messages.stream({
      model: MODEL,
      max_tokens: 3000,
      system,
      messages,
    })
    let text = ''
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        text += event.delta.text
      }
    }
    const final = await stream.finalMessage()
    const outputTokens = final.usage?.output_tokens ?? 0
    const fileTagCount = (text.match(/<file path=/g) || []).length
    return {
      batchIndex, ok: true, ms: Date.now() - start,
      outputTokens, fileTagCount, empty: text.trim().length === 0,
      stopReason: final.stop_reason,
    }
  } catch (err) {
    return {
      batchIndex, ok: false, ms: Date.now() - start,
      errorType: err?.error?.error?.type || err?.status || err?.name,
      errorMessage: (err?.message || String(err)).slice(0, 200),
    }
  }
}

async function runTrial(mode, trialIndex) {
  const indices = Array.from({ length: BATCH_COUNT }, (_, i) => i + 1)
  const start = Date.now()
  let results
  if (mode === 'concurrent') {
    results = await Promise.all(indices.map(runOne))
  } else {
    results = []
    for (const i of indices) results.push(await runOne(i))
  }
  const wallMs = Date.now() - start
  const empties = results.filter(r => r.ok && r.empty).length
  const errors = results.filter(r => !r.ok).length
  const noFileTags = results.filter(r => r.ok && !r.empty && r.fileTagCount === 0).length
  console.log(`[${mode} trial ${trialIndex}] wall=${wallMs}ms empties=${empties}/${BATCH_COUNT} errors=${errors}/${BATCH_COUNT} noFileTags=${noFileTags}/${BATCH_COUNT}`)
  for (const r of results) {
    if (!r.ok) {
      console.log(`  batch ${r.batchIndex}: ERROR type=${r.errorType} msg=${r.errorMessage} (${r.ms}ms)`)
    } else if (r.empty || r.fileTagCount === 0) {
      console.log(`  batch ${r.batchIndex}: SUSPECT empty=${r.empty} fileTags=${r.fileTagCount} stop=${r.stopReason} outTok=${r.outputTokens} (${r.ms}ms)`)
    }
  }
  return { mode, trialIndex, wallMs, empties, errors, noFileTags }
}

const summary = []
for (let t = 1; t <= TRIALS; t++) {
  summary.push(await runTrial('concurrent', t))
}
for (let t = 1; t <= TRIALS; t++) {
  summary.push(await runTrial('sequential', t))
}

console.log('\n=== SUMMARY ===')
for (const mode of ['concurrent', 'sequential']) {
  const rows = summary.filter(r => r.mode === mode)
  const totalCalls = rows.length * BATCH_COUNT
  const totalEmpty = rows.reduce((a, r) => a + r.empties, 0)
  const totalError = rows.reduce((a, r) => a + r.errors, 0)
  const totalNoTags = rows.reduce((a, r) => a + r.noFileTags, 0)
  const avgWall = Math.round(rows.reduce((a, r) => a + r.wallMs, 0) / rows.length)
  console.log(`${mode}: ${totalEmpty + totalError}/${totalCalls} bad calls (empty=${totalEmpty} error=${totalError} noFileTags=${totalNoTags}) | avg wall ${avgWall}ms over ${rows.length} trials`)
}
