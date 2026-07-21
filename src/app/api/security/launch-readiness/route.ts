import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runProjectLaunchReadinessScan } from '@/lib/launch-readiness-project'
import { rateLimit } from '@/lib/rate-limit'

/** Recent scan history for a project (RLS-scoped to the owner). */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = new URL(req.url).searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  try {
    const { data } = await supabase
      .from('launch_readiness_scans')
      .select('id, score, critical_count, source, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(10)
    return NextResponse.json({ scans: data ?? [] })
  } catch {
    return NextResponse.json({ scans: [] })
  }
}

/**
 * Launch-readiness scan. Reads the project's own source directly (see
 * launch-readiness.ts for why that's ground truth, not a static-code guess,
 * for this specific class of check) — no network calls, so it's cheap and
 * works even before the first publish.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { allowed } = rateLimit(`launch-readiness:${user.id}`, 20, 600_000)
  if (!allowed) return NextResponse.json({ error: 'Too many scans in a short time. Please wait a few minutes.' }, { status: 429 })

  const { projectId } = await req.json().catch(() => ({}))
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  try {
    const { found, report } = await runProjectLaunchReadinessScan(supabase, projectId, user.id)
    if (!found) return NextResponse.json({ error: 'Project not found.' }, { status: 404 })
    return NextResponse.json(report)
  } catch (e) {
    return NextResponse.json({ error: 'Scan failed: ' + String(e).slice(0, 200) }, { status: 500 })
  }
}
