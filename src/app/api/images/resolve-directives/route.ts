import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateAndPersistImage } from '@/lib/generate-image-persist'
import { rateLimit } from '@/lib/rate-limit'

// Resolve {{wyber-image}} directives into REAL persisted image URLs for the
// live preview. Without this, previews showed gradient placeholders and users
// read them as broken — then burned edit credits trying to "fix" images that
// were waiting for publish. The preview now shows the same real images publish
// ships.
//
// Economics: generateAndPersistImage is idempotent (stable storage key per
// scope+prompt+ratio, cache-checked before calling OpenAI), so each unique
// image is generated ONCE (~$0.06) and every rebuild/publish after that reuses
// it for free. Caller sends the extracted directives; nothing is written to
// the project — the saved source keeps its tokens.
//
// Generation can take 10-25s per image; they run in parallel, capped.
export const maxDuration = 120

const MAX_DIRECTIVES = 8

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = rateLimit(`img-resolve:${user.id}`, 30, 10 * 60 * 1000)
    if (!limited.allowed) return NextResponse.json({ error: 'Too many image requests — try again in a few minutes.' }, { status: 429 })

    const { projectId, directives } = await req.json()
    if (!projectId || !Array.isArray(directives) || directives.length === 0) {
      return NextResponse.json({ urls: {} })
    }
    // Project must belong to the caller (RLS-scoped read).
    const { data: project } = await supabase.from('projects').select('id').eq('id', projectId).single()
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ urls: {} })

    const admin = createServiceClient()
    const batch = directives.slice(0, MAX_DIRECTIVES) as { token: string; prompt: string; ratio: string }[]
    const results = await Promise.all(batch.map(async d => {
      if (!d?.token || !d?.prompt) return null
      try {
        // Scope = projectId, matching the publish path exactly, so preview and
        // publish share one cache entry per image.
        const url = await generateAndPersistImage(admin, d.prompt, d.ratio, projectId)
        return url ? ([d.token, url] as const) : null
      } catch (e) {
        console.error('[img-resolve] generation failed:', d.prompt.slice(0, 60), e)
        return null
      }
    }))

    const urls: Record<string, string> = {}
    for (const r of results) if (r) urls[r[0]] = r[1]
    return NextResponse.json({ urls })
  } catch (err) {
    console.error('[img-resolve] error', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
