import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { estimateFeatureCost, type BuildSizeTier } from '@/lib/credits'

// Powers the out-of-credits upsell's "you'll probably want next" section
// (UpgradeModal.tsx) — the moment a user hits their credit limit mid-build,
// instead of a flat "buy more credits" pitch, this looks at what THIS
// specific project actually is and suggests 2-3 concrete next features, each
// tagged with a real cost estimate. Same pattern as /api/projects/auto-name:
// a single cheap Haiku call, no streaming, best-effort (never blocks or
// breaks the upgrade flow on failure — see the catch-all below).
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder' })

interface Suggestion {
  title: string
  description: string
  sizeTier: BuildSizeTier
  estimatedCredits: number
}

const SIZE_TIERS: BuildSizeTier[] = ['small', 'medium', 'large', 'xl']

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId } = await req.json()
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

    const admin = await createAdminClient()
    const { data: project, error } = await admin
      .from('projects')
      .select('files, project_type, name, initial_prompt')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const files: Record<string, { content?: string }> = project.files || {}
    const paths = Object.keys(files).filter(p => !p.includes('node_modules'))
    if (paths.length === 0) return NextResponse.json({ suggestions: [] })

    // A handful of the most central files (main pages/screens) give the model
    // real signal about what this app actually does, without shipping the
    // whole project through the API for what's a lightweight, best-effort call.
    const keyFiles = paths
      .filter(p => /\b(App|Home|Dashboard|Landing|page|index)\.(tsx|jsx)$/i.test(p) || /^src\/pages?\//i.test(p))
      .slice(0, 4)
    const snippets = keyFiles
      .map(p => `<file path="${p}">\n${(files[p]?.content || '').slice(0, 1200)}\n</file>`)
      .join('\n\n')

    const prompt = `App name: ${project.name || 'Untitled'}
Original request: ${String(project.initial_prompt || '').slice(0, 300)}
Project type: ${project.project_type || 'web'}

File tree (${paths.length} files):
${paths.slice(0, 100).join('\n').slice(0, 1500)}
${snippets ? `\nKey file contents:\n${snippets.slice(0, 3000)}` : ''}`

    const res = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: `You're looking at a real, in-progress app someone is building. Based on what it already does, suggest exactly 3 SPECIFIC, concrete features they will plausibly want to add next — never generic advice like "add tests" or "improve the design". Ground every suggestion in what THIS particular app is (e.g. a finance app might need a loan/EMI calculator; a CRM might need a pipeline view or email sync; a booking app might need reminders or a waitlist).

Respond ONLY with a JSON array, no markdown, no commentary:
[{"title": "short 2-5 word name", "description": "one sentence, specific to this app", "sizeTier": "small|medium|large"}]

sizeTier guide: "small" = a single UI addition or minor feature (a form, a widget, a settings toggle). "medium" = a new page/section with real logic. "large" = a multi-part feature (a full new workflow, a third-party integration).`,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = res.content.filter(b => b.type === 'text').map(b => (b.type === 'text' ? b.text : '')).join('')
    const clean = text.replace(/```json|```/g, '').trim()
    let parsed: { title?: string; description?: string; sizeTier?: string }[] = []
    try { parsed = JSON.parse(clean) } catch { parsed = [] }

    const suggestions: Suggestion[] = parsed
      .slice(0, 3)
      .map(s => {
        const sizeTier = SIZE_TIERS.includes(s.sizeTier as BuildSizeTier) ? (s.sizeTier as BuildSizeTier) : 'medium'
        return {
          title: String(s.title || '').slice(0, 60),
          description: String(s.description || '').slice(0, 160),
          sizeTier,
          estimatedCredits: estimateFeatureCost(sizeTier),
        }
      })
      .filter(s => s.title)

    return NextResponse.json({ suggestions })
  } catch (err) {
    // Never let this block or error out the upgrade flow it's decorating —
    // the modal treats an empty list as "no suggestions available" and just
    // shows the normal pricing options.
    console.error('[credits/next-feature-suggestions] Error:', err)
    return NextResponse.json({ suggestions: [] })
  }
}
