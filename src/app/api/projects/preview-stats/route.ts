import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// Preview activity for a project's owner — makes the preview-access credit
// model (src/app/api/preview-access/route.ts) transparent: how often it's
// being scanned, by how many distinct people, and what it's cost this month.
export async function GET(req: NextRequest) {
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const projectId = req.nextUrl.searchParams.get('projectId')
    if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 })

    const admin = createServiceClient()
    const { data: project } = await admin.from('projects').select('user_id').eq('id', projectId).maybeSingle()
    if (!project || project.user_id !== user.id) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    // Fetch from whichever boundary is EARLIER — near the start of a month,
    // "this week" reaches back into the previous month, and monthStart alone
    // would silently drop those days from both the weekly count and the
    // 7-day sparkline (both undercounting for the first few days of a month).
    const fetchSince = weekAgo < monthStart ? weekAgo : monthStart

    const { data: rows } = await admin
      .from('preview_sessions')
      .select('viewer_id, credits_charged, access_date, created_at')
      .eq('project_id', projectId)
      .gte('created_at', fetchSince.toISOString())
      .order('created_at', { ascending: true })

    const all = rows ?? []
    const thisWeek = all.filter(r => new Date(r.created_at) >= weekAgo)
    const thisMonth = all.filter(r => new Date(r.created_at) >= monthStart)
    const uniqueViewers = new Set(thisMonth.map(r => r.viewer_id)).size
    const creditsChargedThisMonth = thisMonth.reduce((sum, r) => sum + (r.credits_charged ?? 0), 0)

    // 7-day daily breakdown, oldest first, zero-filled for days with no opens.
    const daily: { date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().slice(0, 10)
      daily.push({ date: key, count: all.filter(r => r.access_date === key).length })
    }

    return NextResponse.json({
      opensThisWeek: thisWeek.length,
      uniqueViewers,
      creditsChargedThisMonth,
      daily,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
