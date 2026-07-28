import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runProjectWyberCloudScan } from '@/lib/wybercloud-scan-project'
import { rateLimit } from '@/lib/rate-limit'

/** Recent scan history for a project (RLS-scoped to the owner). Shares the
 * same security_scans table as the Supabase RLS scanner — filtered by
 * method='wybercloud-probe' on the client side isn't needed since a project
 * only ever has one connector type. */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = new URL(req.url).searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  try {
    const { data } = await supabase
      .from('security_scans')
      .select('id, score, critical_count, reachable, method, source, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(10)
    return NextResponse.json({ scans: data ?? [] })
  } catch {
    return NextResponse.json({ scans: [] })
  }
}

/**
 * WyberCloud trust scan. There's no anon-key/PostgREST layer to probe here —
 * the only public surface is the INSERT-only /api/public/cloud-insert
 * endpoint, already locked to public_* tables and their real columns. So this
 * scan asks the question that endpoint's own guardrails can't: did a public_*
 * table end up holding something a random visitor shouldn't be able to write
 * (a password field, an admin flag), or does a table's own name suggest it
 * shouldn't have opted into public writes in the first place.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Each scan opens a real connection to the customer's live Cloud SQL
  // instance — cheap for us, but don't let a stuck client hammer it.
  const { allowed } = rateLimit(`wybercloud-scan:${user.id}`, 15, 600_000)
  if (!allowed) return NextResponse.json({ error: 'Too many scans in a short time. Please wait a few minutes.' }, { status: 429 })

  const { projectId } = await req.json().catch(() => ({}))
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  try {
    const { connected, report } = await runProjectWyberCloudScan(supabase, projectId, user.id)
    if (!connected) {
      return NextResponse.json(
        { error: 'WyberCloud is not connected (or not ready yet) for this project.' },
        { status: 400 },
      )
    }
    return NextResponse.json(report)
  } catch (e) {
    return NextResponse.json({ error: 'Scan failed: ' + String(e).slice(0, 200) }, { status: 500 })
  }
}
