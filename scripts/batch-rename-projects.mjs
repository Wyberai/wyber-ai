// One-off cleanup: projects created before creation-time smart naming
// (auto-name route, Jul 2 2026) kept a raw 40-char prompt slice — or the
// "New Project HH:MM" default — as their permanent name. This renames ONLY
// those (a manual rename never matches the auto-name heuristics, so it always
// wins), using the same Haiku prompt as /api/projects/auto-name.
//
//   node scripts/batch-rename-projects.mjs           # dry run — prints plan
//   node scripts/batch-rename-projects.mjs --apply   # actually renames
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
const APPLY = process.argv.includes('--apply')

const { data: projects, error } = await supabase
  .from('projects')
  .select('id, name, initial_prompt, created_at')
  .order('created_at', { ascending: false })
  .limit(500)
if (error) { console.error('fetch failed:', error.message); process.exit(1) }

const needsRename = projects.filter(p => {
  const name = (p.name ?? '').trim()
  const prompt = (p.initial_prompt ?? '').trim()
  if (!name || !prompt) return false
  if (/^New Project /.test(name)) return true
  // Prompt-slice heuristic: name is a prefix of the initial prompt (the old
  // creation path did prompt.slice(0, 40)). Covers trimmed variants too.
  return prompt.slice(0, 60).toLowerCase().startsWith(name.toLowerCase()) && name.length >= 15
})

console.log(`${projects.length} projects scanned, ${needsRename.length} still carry auto names.\n`)

for (const p of needsRename) {
  let newName = ''
  try {
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 20,
      system: `Name an app based on what the user asked to build. 2-4 words, title case, no quotes, no punctuation, not the word "app" unless it's part of a proper name. Output ONLY the name, nothing else.`,
      messages: [{ role: 'user', content: p.initial_prompt.slice(0, 500) }],
    })
    newName = res.content.filter(b => b.type === 'text').map(b => b.text).join('').trim().slice(0, 60)
  } catch (e) {
    console.log(`  SKIP ${p.id} — Haiku error: ${e.message}`)
    continue
  }
  if (!newName) { console.log(`  SKIP ${p.id} — empty name`); continue }

  if (APPLY) {
    const { error: upErr } = await supabase.from('projects').update({ name: newName }).eq('id', p.id)
    console.log(upErr ? `  FAIL ${p.id}: ${upErr.message}` : `  ✓ "${p.name}" → "${newName}"`)
  } else {
    console.log(`  would rename "${p.name}" → "${newName}"`)
  }
}

console.log(`\n${APPLY ? 'Done.' : 'Dry run only — re-run with --apply to rename.'}`)
