// Smart app matcher - checks prebuilt DB before calling Claude
// If match found: instant load, 0 credits consumed
// If no match: generate with Claude, save to DB for future users

import { createClient } from '@/lib/supabase/client'

interface PrebuiltApp {
  id: string
  name: string
  category: string
  keywords: string[]
  files: Record<string, string>
  preview_color: string
}

// Score a prompt against an app's keywords
function scoreMatch(prompt: string, keywords: string[]): number {
  const p = prompt.toLowerCase()
  let score = 0
  for (const kw of keywords) {
    if (p.includes(kw.toLowerCase())) {
      score += kw.length > 6 ? 3 : kw.length > 4 ? 2 : 1
    }
  }
  return score
}

export async function findPrebuiltMatch(prompt: string): Promise<PrebuiltApp | null> {
  try {
    const supabase = createClient()

    const words = prompt.toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(' ')
      .filter(w => w.length > 3)
      .slice(0, 8)

    if (words.length === 0) return null

    // Try GCS-cached index first for faster matching
    const gcsBucket = process.env.GCS_TEMPLATE_BUCKET
    if (gcsBucket) {
      try {
        const indexRes = await fetch(`https://storage.googleapis.com/${gcsBucket}/index/web.json`, {
          next: { revalidate: 300 },
        })
        if (indexRes.ok) {
          const index = await indexRes.json() as Array<{ id: string; name: string; category: string; description: string; preview_color: string }>
          let bestId: string | null = null
          let bestScore = 0
          for (const entry of index) {
            const entryWords = entry.name.toLowerCase().split(/[\s\-&/,]+/)
            const score = scoreMatch(prompt, entryWords)
            if (score > bestScore) { bestScore = score; bestId = entry.id }
          }
          if (bestId && bestScore >= 3) {
            const templateRes = await fetch(`https://storage.googleapis.com/${gcsBucket}/templates/${bestId}.json`)
            if (templateRes.ok) {
              const template = await templateRes.json() as PrebuiltApp
              supabase.rpc('increment_app_use', { app_id: bestId }).then(() => {})
              return template
            }
          }
        }
      } catch { /* fall through to Supabase */ }
    }

    // Fallback: query Supabase directly
    const { data: candidates } = await supabase
      .from('prebuilt_apps')
      .select('id, name, category, keywords, files, preview_color')
      .eq('valid', true)
      .overlaps('keywords', words)
      .limit(10)

    if (!candidates || candidates.length === 0) return null

    let best: PrebuiltApp | null = null
    let bestScore = 0

    for (const app of candidates) {
      const score = scoreMatch(prompt, app.keywords)
      if (score > bestScore) {
        bestScore = score
        best = app
      }
    }

    if (bestScore < 3) return null

    if (best) {
      supabase.rpc('increment_app_use', { app_id: best.id }).then(() => {})
    }

    return best
  } catch {
    return null
  }
}

// Save a newly generated app to the DB for future instant loads
export async function saveGeneratedApp(
  prompt: string,
  files: Record<string, { path: string; content: string; language: string }>,
  category: string
): Promise<void> {
  try {
    const supabase = createClient()

    // Extract keywords from prompt
    const keywords = prompt.toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(' ')
      .filter(w => w.length > 3)
      .slice(0, 15)

    // Convert file map to simple path→content map
    const fileMap: Record<string, string> = {}
    for (const [, f] of Object.entries(files)) {
      if (f.content && f.content.length > 50) {
        fileMap[f.path] = f.content
      }
    }

    if (Object.keys(fileMap).length < 2) return

    await supabase.from('prebuilt_apps').insert({
      name: prompt.slice(0, 60),
      category,
      keywords,
      files: fileMap,
      description: prompt,
      preview_color: '#0EA5E9',
    })
  } catch {
    // Fail silently - this is a background optimization
  }
}
