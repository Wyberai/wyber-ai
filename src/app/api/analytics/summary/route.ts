import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const days = Math.min(parseInt(searchParams.get('days') || '7', 10), 90)
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

    const admin = await createAdminClient()

    // Verify ownership before touching page_views.
    const { data: project } = await admin.from('projects').select('id').eq('id', projectId).eq('user_id', user.id).maybeSingle()
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
      console.error('[analytics/summary] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = views || []
    const visitors = new Set(rows.map(r => r.session_id)).size
    const pageViews = rows.length

    const pathCounts = new Map<string, number>()
    const referrerCounts = new Map<string, number>()
    const dayCounts = new Map<string, number>()

    for (const r of rows) {
      pathCounts.set(r.path, (pathCounts.get(r.path) || 0) + 1)
      const ref = r.referrer ? new URL(r.referrer, 'https://x.invalid').hostname : 'Direct'
      referrerCounts.set(ref, (referrerCounts.get(ref) || 0) + 1)
      const day = r.created_at.slice(0, 10)
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1)
    }

    const topPages = [...pathCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([path, count]) => ({ path, count }))
    const topReferrers = [...referrerCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([source, count]) => ({ source, count }))
    const daily = [...dayCounts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }))

    return NextResponse.json({
      visitors,
      pageViews,
      viewsPerVisit: visitors > 0 ? Math.round((pageViews / visitors) * 10) / 10 : 0,
      topPages,
      topReferrers,
      daily,
      rangeDays: days,
    })
  } catch (err) {
    console.error('[analytics/summary] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
