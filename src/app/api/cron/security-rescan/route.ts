import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { runProjectRlsScan } from '@/lib/rls-scan-project'

export const maxDuration = 300

const STALE_MS = 7 * 24 * 60 * 60 * 1000
const MAX_PROJECTS = 200
const BATCH_SIZE = 5

// Keeps every project's security_scans row fresh without the user ever having
// to click "scan" — the dashboard's security chrome (Phase 2) reads only this
// table, never live-probing a customer's Supabase on page load.
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Only bother rescanning projects touched in the last 60 days — abandoned
  // projects don't need a daily probe against their (possibly stale) DB.
  const activeSince = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  const { data: connectors, error } = await admin
    .from('project_connectors')
    .select('project_id, user_id, projects!inner(id, updated_at)')
    .eq('service', 'supabase')
    .not('project_id', 'is', null)
    .gte('projects.updated_at', activeSince)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const staleCutoff = Date.now() - STALE_MS
  const { data: recentScans } = await admin
    .from('security_scans')
    .select('project_id, created_at')
    .order('created_at', { ascending: false })
  const latestScanAt = new Map<string, number>()
  for (const row of recentScans ?? []) {
    if (!latestScanAt.has(row.project_id)) latestScanAt.set(row.project_id, new Date(row.created_at).getTime())
  }

  const candidates = (connectors ?? [])
    .filter((c) => {
      const last = latestScanAt.get(c.project_id)
      return last === undefined || last < staleCutoff
    })
    .slice(0, MAX_PROJECTS)

  let scanned = 0
  let failed = 0
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(
      batch.map((c) =>
        runProjectRlsScan(admin, c.project_id, c.user_id, 'scheduled').catch(() => null)
      )
    )
    for (const r of results) {
      if (r) scanned++
      else failed++
    }
  }

  return NextResponse.json({
    success: true,
    candidates: candidates.length,
    scanned,
    failed,
    timestamp: new Date().toISOString(),
  })
}
