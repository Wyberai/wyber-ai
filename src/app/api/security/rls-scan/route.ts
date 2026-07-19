import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runProjectRlsScan, applyProjectRlsFix } from '@/lib/rls-scan-project'
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
 * RLS-correctness scan. Unlike an LLM reading frontend code, this takes the
 * project's PUBLIC anon key and actually tries to read every table over
 * PostgREST with no user logged in — the exact thing an attacker does. Rows that
 * come back are a proven live data leak (the CVE-2025-48757 failure mode). When
 * the Supabase Management API is connected (OAuth) we also confirm RLS-disabled
 * tables and can auto-apply fixes. Strictly read-only unless action === 'apply'.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Each scan probes the customer's live Supabase over PostgREST table-by-table
  // — cheap for us, but don't let a stuck client hammer THEIR database.
  const { allowed } = rateLimit(`rls-scan:${user.id}`, 15, 600_000)
  if (!allowed) return NextResponse.json({ error: 'Too many scans in a short time. Please wait a few minutes.' }, { status: 429 })

  const { projectId, action = 'scan', tables } = await req.json().catch(() => ({}))
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  // ── Auto-fix path ──────────────────────────────────────────────────────────
  if (action === 'apply') {
    const requested: string[] = Array.isArray(tables) ? tables : []
    if (requested.length === 0) return NextResponse.json({ error: 'No tables specified to fix.' }, { status: 400 })
    const result = await applyProjectRlsFix(supabase, projectId, user.id, requested)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ applied: result.applied })
  }

  // ── Scan path ──────────────────────────────────────────────────────────────
  try {
    const { connected, blockedRef, report } = await runProjectRlsScan(supabase, projectId, user.id)
    if (blockedRef) return NextResponse.json({ error: 'That project cannot be scanned.' }, { status: 403 })
    if (!connected) {
      return NextResponse.json(
        { error: 'Supabase is not connected for this project. Connect it to run a security scan.' },
        { status: 400 },
      )
    }
    return NextResponse.json(report)
  } catch (e) {
    return NextResponse.json({ error: 'Scan failed: ' + String(e).slice(0, 200) }, { status: 500 })
  }
}
