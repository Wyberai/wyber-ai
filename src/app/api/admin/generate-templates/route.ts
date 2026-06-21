import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 300

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

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

export async function POST(req: NextRequest) {
  try {
    const authKey = req.headers.get('x-admin-key')
    if (authKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({})) as { offset?: number; limit?: number; ids?: string[] }
    const admin = getAdmin()

    let apps: any[]
    if (body.ids?.length) {
      const { data } = await admin.from('prebuilt_apps').select('id, name, category, description').in('id', body.ids)
      apps = data ?? []
    } else {
      const offset = body.offset ?? 0
      const limit = Math.min(body.limit ?? 5, 10)
      // Get templates that either have no files, empty files, or old single-code format
      const { data } = await admin
        .from('prebuilt_apps')
        .select('id, name, category, description, files')
        .eq('valid', true)
        .range(offset, offset + limit - 1)
      // Filter to only templates needing regeneration
      const needsRegen = (data ?? []).filter(app => {
        const f = app.files as Record<string, unknown> | null
        if (!f || Object.keys(f).length === 0) return true
        if (typeof (f as any).code === 'string') return true // old format
        if (!f['src/App.tsx'] && !f['src/App.jsx']) return true // no app entry
        return false
      })
      apps = needsRegen
    }

    if (!apps.length) return NextResponse.json({ done: true, generated: 0, message: 'No templates need regeneration in this range' })

    let count = 0
    const results: string[] = []

    for (const app of apps) {
      try {
        const response = await anthropic.messages.create({
          model: 'claude-opus-4-8',
          max_tokens: 4096,
          system: SYSTEM,
          messages: [{
            role: 'user',
            content: `Build a "${app.name}" app. Category: ${app.category}. ${app.description || ''}`,
          }],
        })

        const text = response.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')

        const files: Record<string, { path: string; content: string; language: string }> = {}
        const langMap: Record<string, string> = { tsx: 'typescript', jsx: 'javascript', ts: 'typescript', js: 'javascript', css: 'css', html: 'html', json: 'json' }

        // Try <file path="...">...</file> format first
        const fileRegex = /<file\s+path="([^"]+)">([\s\S]*?)<\/file>/g
        let match
        while ((match = fileRegex.exec(text)) !== null) {
          const p = match[1]; const ext = p.split('.').pop() ?? ''
          files[p] = { path: p, content: match[2].trim(), language: langMap[ext] ?? 'plaintext' }
        }

        // Fallback: if no <file> blocks, treat entire output as App.tsx
        if (Object.keys(files).length === 0) {
          let code = text.replace(/```(?:tsx|jsx|typescript|javascript)?\n?/g, '').replace(/```\n?/g, '').trim()
          code = code.replace(/^<file\s+path="[^"]*">\s*/g, '').replace(/\s*<\/file>\s*$/g, '')
          if (code.includes('export default') || code.includes('function App')) {
            files['src/App.tsx'] = { path: 'src/App.tsx', content: code, language: 'typescript' }
          }
        }

        if (Object.keys(files).length < 1) {
          results.push(`[SKIP] ${app.name}: no usable code in response`)
          continue
        }

        // Ensure index.css exists
        if (!files['src/index.css']) {
          files['src/index.css'] = { path: 'src/index.css', content: '*, *::before, *::after { box-sizing: border-box; }\nbody { margin: 0; padding: 0; }', language: 'css' }
        }

        await admin.from('prebuilt_apps').update({ files }).eq('id', app.id)
        results.push(`[OK] ${app.name}: ${Object.keys(files).length} files`)
        count++
      } catch (err) {
        results.push(`[ERROR] ${app.name}: ${String(err).slice(0, 100)}`)
      }
    }

    return NextResponse.json({
      generated: count,
      total: apps.length,
      results,
      hasMore: apps.length >= (body.limit ?? 5),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
