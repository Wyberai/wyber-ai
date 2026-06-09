import { createServiceClient } from '@/lib/supabase/server'

// Finds the closest prebuilt template to a prompt and returns it as a STYLE/STRUCTURE
// reference string to inject into the system prompt. The AI still builds fresh — this
// just gives it a known-good example to follow for consistency and speed.
export async function getTemplateReference(prompt: string): Promise<string> {
  try {
    const supabase = createServiceClient()
    const stopWords = new Set(['build','create','make','want','need','with','that','have','this','from','for','and','the','can','get','app'])
    const words = prompt.toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(' ')
      .filter((w: string) => w.length > 3 && !stopWords.has(w))
      .slice(0, 10)

    if (words.length === 0) return ''

    const { data: matches } = await supabase
      .from('prebuilt_apps')
      .select('name, category, files, keywords')
      .overlaps('keywords', words)
      .not('files', 'eq', '{}')
      .not('files', 'is', null)
      .limit(8)

    if (!matches || matches.length === 0) return ''

    // Score matches
    let best: any = null
    let bestScore = 0
    for (const m of matches) {
      const fileCount = m.files ? Object.keys(m.files).length : 0
      if (fileCount < 2) continue
      let score = 0
      const tk = (m.keywords || []) as string[]
      score += words.filter((w: string) => tk.some((k: string) => k.includes(w) || w.includes(k))).length * 2
      score += words.filter((w: string) => m.name?.toLowerCase().includes(w)).length * 3
      score += words.filter((w: string) => m.category?.toLowerCase().includes(w)).length * 2
      if (score > bestScore) { bestScore = score; best = m }
    }

    // Only inject a reference if there's at least a weak match
    if (!best || bestScore < 1) return ''

    // Pull just App.tsx + index.css as the reference (structure + style), capped in size
    const files = best.files as Record<string, string>
    const appKey = Object.keys(files).find(k => /app\.(tsx|jsx)$/i.test(k))
    const cssKey = Object.keys(files).find(k => /index\.css$/i.test(k))
    const appContent = appKey ? files[appKey].slice(0, 2500) : ''
    const cssContent = cssKey ? files[cssKey].slice(0, 1500) : ''
    if (!appContent) return ''

    return `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STYLE & STRUCTURE REFERENCE (follow this quality bar)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Below is a similar high-quality Wyber app ("${best.name}"). Use it ONLY as a reference for
structure, component patterns, and visual quality. Do NOT copy its content or features —
build exactly what the user asked for, fresh. Match this level of polish and this file structure.

REFERENCE App.tsx (excerpt):
${appContent}

REFERENCE index.css (excerpt):
${cssContent}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
  } catch {
    return ''
  }
}
