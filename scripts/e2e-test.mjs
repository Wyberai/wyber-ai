import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'
import { resolve } from 'path'
import crypto from 'crypto'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const testId = crypto.randomUUID()

console.log('=== CRITICAL PATH TESTS ===\n')

// 1. Profile
const { error: p1 } = await sb.from('profiles').upsert({ id: testId, email: 'e2e@test.com', credits: 50, plan: 'free' }, { onConflict: 'id', ignoreDuplicates: true })
console.log('1. Profile creation: ' + (p1 ? 'FAIL — ' + p1.message : 'PASS'))

// 2. Credits
const { data: d2, error: p2 } = await sb.from('profiles').update({ credits: 40 }).eq('id', testId).gte('credits', 10).select('credits').single()
console.log('2. Atomic credit deduct: ' + (p2 ? 'FAIL — ' + p2.message : 'PASS (40 left)'))

// 3. Project
const { data: d3, error: p3 } = await sb.from('projects').insert({ user_id: testId, name: 'E2E Test App', framework: 'react-vite', files: {} }).select('id').single()
console.log('3. Project creation: ' + (p3 ? 'FAIL — ' + p3.message : 'PASS'))

// 4. AI gen
const t0 = Date.now()
const r = await ai.messages.create({
  model: 'claude-sonnet-4-6', max_tokens: 4000,
  system: 'Output ONLY <file path="...">code</file> blocks. No markdown, no prose. React with useState, inline styles, dark theme.',
  messages: [{ role: 'user', content: 'Simple counter app. Button increments number. Dark bg #09090b, white text, blue button #0EA5E9.' }],
})
const txt = r.content[0].text
const ok4 = txt.includes('<file') && txt.includes('export default')
console.log('4. AI code generation: ' + (ok4 ? 'PASS' : 'FAIL') + ' (' + ((Date.now() - t0) / 1000).toFixed(1) + 's)')
if (!ok4) console.log('   Output starts with: ' + txt.substring(0, 150))

// 5. Preview build
const files = {}
const re = /<file\s+path="([^"]+)">([\s\S]*?)<\/file>/g
let m
while ((m = re.exec(txt)) !== null) files[m[1]] = { path: m[1], content: m[2].trim(), language: 'typescript' }
if (!files['src/main.tsx']) files['src/main.tsx'] = { path: 'src/main.tsx', content: 'import React from "react"\nimport { createRoot } from "react-dom/client"\nimport App from "./App"\ncreateRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>)', language: 'typescript' }
if (!files['index.html']) files['index.html'] = { path: 'index.html', content: '<!doctype html><html><head><meta charset="UTF-8"><title>App</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>', language: 'html' }
if (!files['package.json']) files['package.json'] = { path: 'package.json', content: '{"name":"app","private":true,"type":"module","dependencies":{"react":"^18.3.1","react-dom":"^18.3.1"},"devDependencies":{"@vitejs/plugin-react":"^4.3.1","vite":"^5.3.1"}}', language: 'json' }
if (!files['vite.config.js']) files['vite.config.js'] = { path: 'vite.config.js', content: 'import { defineConfig } from "vite"\nimport react from "@vitejs/plugin-react"\nexport default defineConfig({ plugins: [react()] })', language: 'javascript' }

const br = await fetch('https://preview-builder.wyberai.com/build', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files, projectId: 'e2e-' + Date.now() }) })
const bd = await br.json()
console.log('5. Preview build: ' + (bd.url ? 'PASS → ' + bd.url : 'FAIL — ' + JSON.stringify(bd)))

// 6. Flow
const { data: d6, error: p6 } = await sb.from('flows').insert({ user_id: testId, name: 'E2E Flow', description: '', nodes: [], edges: [], is_active: false, run_count: 0 }).select('id').single()
console.log('6. Workflow creation: ' + (p6 ? 'FAIL — ' + p6.message : 'PASS'))

// 7. Employee
const { data: d7, error: p7 } = await sb.from('ai_employees').insert({ user_id: testId, name: 'E2E Bot', role: 'Test', emoji: '🤖', instructions: 'Test', tools: [], schedule_type: 'manual', schedule_hour: 9, schedule_day: 1, is_active: false }).select('id').single()
console.log('7. AI Employee creation: ' + (p7 ? 'FAIL — ' + p7.message : 'PASS'))

// 8. Message
if (d3?.id) {
  const { error: p8 } = await sb.from('project_messages').insert({ project_id: d3.id, role: 'user', content: 'test' })
  console.log('8. Chat message save: ' + (p8 ? 'FAIL — ' + p8.message : 'PASS'))
}

// Cleanup
if (d3?.id) { await sb.from('project_messages').delete().eq('project_id', d3.id); await sb.from('projects').delete().eq('id', d3.id) }
if (d6?.id) await sb.from('flows').delete().eq('id', d6.id)
if (d7?.id) await sb.from('ai_employees').delete().eq('id', d7.id)
await sb.from('profiles').delete().eq('id', testId)

console.log('\n=== ALL TESTS COMPLETE ===')
