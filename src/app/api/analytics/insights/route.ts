import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Powers the "Insights" card in AnalyticsPanel.tsx — turns the raw page_views
// aggregates that /api/analytics/summary already computes into 2-3 plain-English,
// specific-to-this-app observations. Same pattern as
// /api/credits/next-feature-suggestions: a single cheap Haiku call, best-effort,
// never blocks or errors out the analytics panel on failure.
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder' })

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const projectId = body.projectId as string | undefined
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    const days = Math.min(parseInt(body.days, 10) || 7, 90)

    const admin = await createAdminClient()

    const { data: project } = await admin
      .from('projects')
      .select('name, project_type, initial_prompt')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const { data: views, error } = await admin
      .from('page_views')
      .select('path, referrer, session_id, created_at')
      .eq('project_id', projectId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10000)

    if (error) {
      console.error('[analytics/insights] Error:', error)
      return NextResponse.json({ insights: [] })
    }

    const rows = views || []
    // Too little signal for the model to say anything real — stay quiet
    // rather than force a generic observation out of noise.
    if (rows.length < 5) return NextResponse.json({ insights: [] })

    const pathCounts = new Map<string, number>()
    const referrerCounts = new Map<string, number>()
    const sessionPaths = new Map<string, number>()
    for (const r of rows) {
      pathCounts.set(r.path, (pathCounts.get(r.path) || 0) + 1)
      const ref = r.referrer ? new URL(r.referrer, 'https://x.invalid').hostname : 'Direct'
      referrerCounts.set(ref, (referrerCounts.get(ref) || 0) + 1)
      sessionPaths.set(r.session_id, (sessionPaths.get(r.session_id) || 0) + 1)
    }

    const topPages = [...pathCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
    const topReferrers = [...referrerCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    const visitors = sessionPaths.size
    const singlePageSessions = [...sessionPaths.values()].filter(c => c === 1).length

    const prompt = `App: ${project.name || 'Untitled'} (${project.project_type || 'web'})
Original request: ${String(project.initial_prompt || '').slice(0, 200)}

Last ${days} days: ${visitors} visitors, ${rows.length} page views.
Top pages by views: ${topPages.map(([p, c]) => `${p} (${c})`).join(', ') || 'none'}
Top referrers: ${topReferrers.map(([s, c]) => `${s} (${c})`).join(', ') || 'none'}
Single-page sessions (left after one page): ${singlePageSessions} of ${visitors}`

    const res = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: `You're a product analyst looking at real traffic for one specific app. Write 2-3 short, concrete observations a founder can act on today — never generic advice like "monitor your traffic" or "add more content". Ground every observation in the actual numbers given (name the specific page or referrer). If the data doesn't support a real insight, return fewer items rather than padding with filler.

Respond ONLY with a JSON array, no markdown, no commentary:
[{"text": "one sentence observation"}]`,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = res.content.filter(b => b.type === 'text').map(b => (b.type === 'text' ? b.text : '')).join('')
    const clean = text.replace(/```json|```/g, '').trim()
    let parsed: { text?: string }[] = []
    try { parsed = JSON.parse(clean) } catch { parsed = [] }

    const insights = parsed
      .slice(0, 3)
      .map(i => String(i.text || '').slice(0, 200))
      .filter(Boolean)

    return NextResponse.json({ insights })
  } catch (err) {
    // Never let this block or error out the analytics panel it's decorating.
    console.error('[analytics/insights] Error:', err)
    return NextResponse.json({ insights: [] })
  }
}
