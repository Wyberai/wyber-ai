import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `You generate complete, self-contained React apps. Output ONLY <file> blocks — no prose.

Rules:
- Dark theme: bg #09090b, cards #111113, border rgba(255,255,255,0.08), text #fafafa, accent #0EA5E9
- Inline styles only (style={{ }}) — no CSS files, no Tailwind
- import { useState } from 'react' — no other imports
- Realistic mock data (8-15 records with names, dates, numbers)
- export default function App() as the main component
- Every file must be complete and syntactically valid JSX
- Max 250 lines per file
- Use proper spacing, hierarchy, and visual polish

Required files:
<file path="src/App.tsx">...complete app with all components inline...</file>
<file path="src/index.css">*, *::before, *::after { box-sizing: border-box; } body { margin: 0; }</file>

Output ONLY these <file> blocks. Nothing else.`

const langMap = { tsx: 'typescript', jsx: 'javascript', ts: 'typescript', js: 'javascript', css: 'css', html: 'html', json: 'json' }

const limit = parseInt(process.argv[2] || '10')
const offset = parseInt(process.argv[3] || '0')

const { data: apps, error } = await supabase
  .from('prebuilt_apps')
  .select('id, name, category, description, files')
  .eq('valid', true)
  .range(offset, offset + 500 - 1)

if (error) { console.error('DB error:', error); process.exit(1) }

const needsRegen = apps.filter(app => {
  const f = app.files
  if (!f || Object.keys(f).length === 0) return true
  if (typeof f.code === 'string') return true
  if (!f['src/App.tsx'] && !f['src/App.jsx']) return true
  return false
}).slice(0, limit)

console.log(`Found ${needsRegen.length} templates needing regeneration (offset ${offset})`)

let ok = 0, fail = 0
for (const app of needsRegen) {
  const t0 = Date.now()
  process.stdout.write(`[${ok + fail + 1}/${needsRegen.length}] ${app.name}...`)
  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      system: SYSTEM,
      messages: [{ role: 'user', content: `Build a "${app.name}" app. Category: ${app.category}. ${app.description || ''}` }],
    })

    const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('')
    const files = {}

    const fileRegex = /<file\s+path="([^"]+)">([\s\S]*?)<\/file>/g
    let match
    while ((match = fileRegex.exec(text)) !== null) {
      const p = match[1], ext = p.split('.').pop() ?? ''
      files[p] = { path: p, content: match[2].trim(), language: langMap[ext] ?? 'plaintext' }
    }

    if (Object.keys(files).length === 0) {
      let code = text.replace(/```(?:tsx|jsx|typescript|javascript)?\n?/g, '').replace(/```\n?/g, '').trim()
      if (code.includes('export default') || code.includes('function App')) {
        files['src/App.tsx'] = { path: 'src/App.tsx', content: code, language: 'typescript' }
      }
    }

    if (Object.keys(files).length < 1) {
      console.log(` SKIP (no usable code) [${((Date.now()-t0)/1000).toFixed(1)}s]`)
      fail++
      continue
    }

    if (!files['src/index.css']) {
      files['src/index.css'] = { path: 'src/index.css', content: '*, *::before, *::after { box-sizing: border-box; }\nbody { margin: 0; padding: 0; }', language: 'css' }
    }

    await supabase.from('prebuilt_apps').update({ files }).eq('id', app.id)
    console.log(` OK (${Object.keys(files).length} files) [${((Date.now()-t0)/1000).toFixed(1)}s]`)
    ok++
  } catch (err) {
    console.log(` ERROR: ${String(err).slice(0, 80)} [${((Date.now()-t0)/1000).toFixed(1)}s]`)
    fail++
  }
}

console.log(`\nDone: ${ok} generated, ${fail} failed/skipped`)
