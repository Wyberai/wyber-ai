import { createServiceClient } from '@/lib/supabase/server'

// Finds the closest prebuilt template and injects it as a scaffold the model
// starts from rather than a loose style hint. Generating FROM a scaffold
// (adapt/customise) is significantly faster than generating from scratch
// (invent everything) because the model skips architectural decisions and
// just fills in the user-specific content.
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

    if (!best || bestScore < 1) return ''

    const files = best.files as Record<string, string>
    const keys = Object.keys(files)

    // App.tsx / index.css are the structural anchors — inject in full (up to
    // generous caps) so the model has the complete component tree and token set
    // to start from, not just a taste of it.
    const appKey = keys.find(k => /app\.(tsx|jsx)$/i.test(k))
    const cssKey = keys.find(k => /index\.css$/i.test(k))
    const appContent = appKey ? files[appKey].slice(0, 8000) : ''
    const cssContent = cssKey ? files[cssKey].slice(0, 5000) : ''
    if (!appContent) return ''

    // Pull up to 3 component files (likely to contain reusable patterns the
    // model should follow rather than reinvent — cards, forms, nav, etc.)
    const componentKeys = keys
      .filter(k => !appKey || k !== appKey)
      .filter(k => !cssKey  || k !== cssKey)
      .filter(k => /\.(tsx|jsx|ts|js)$/.test(k))
      .slice(0, 3)

    const componentParts = componentKeys.length > 0
      ? '\n\n' + componentKeys.map(k =>
          `Scaffold component "${k}":\n${files[k].slice(0, 2500)}`
        ).join('\n\n')
      : ''

    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCAFFOLD — start here, customise for the user's request
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Below is "${best.name}" — a proven ${best.category ?? 'app'} scaffold.
Adapt its file structure, component patterns, CSS variable conventions, and
import organisation to build exactly what the user asked for. Replace every
piece of placeholder content, the app name, features, copy, and colour palette
with what the user actually needs. Improve the visual design beyond the scaffold
if you can. Output complete <file> blocks for every file — do NOT output the
scaffold's content unchanged; every file must reflect the user's specific request.

Scaffold App.tsx:
${appContent}

Scaffold index.css:
${cssContent}${componentParts}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
  } catch {
    return ''
  }
}

export interface TemplateSeed {
  files: Record<string, string>
  name: string
  category: string
}

/**
 * Returns the FULL file map of the best matching template so the client can
 * pre-load it before the scaffold/fill passes run. The plan stage then uses
 * these files as "current files", generating an edit-completeness plan
 * (only listing files to change) instead of a full from-scratch manifest —
 * this alone cuts planned file count by ~50-70%, reducing staged pass count
 * and total build time.
 */
export async function getTemplateSeed(prompt: string): Promise<TemplateSeed | null> {
  try {
    const supabase = createServiceClient()
    const stopWords = new Set(['build','create','make','want','need','with','that','have','this','from','for','and','the','can','get','app'])
    const words = prompt.toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(' ')
      .filter((w: string) => w.length > 3 && !stopWords.has(w))
      .slice(0, 10)

    if (words.length === 0) return null

    const { data: matches } = await supabase
      .from('prebuilt_apps')
      .select('name, category, files, keywords')
      .overlaps('keywords', words)
      .not('files', 'eq', '{}')
      .not('files', 'is', null)
      .limit(8)

    if (!matches || matches.length === 0) return null

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

    if (!best || bestScore < 1) return null

    const files = best.files as Record<string, string>
    if (Object.keys(files).length < 2) return null

    return { files, name: best.name as string, category: (best.category ?? 'app') as string }
  } catch {
    return null
  }
}
