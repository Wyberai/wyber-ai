import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnonConnector, getMgmtToken } from '@/lib/rls-scan-project'
import { getProject, restoreProject } from '@/lib/supabase-management'

/**
 * Health check + one-click restore for a project's connected Supabase DB.
 *
 * Supabase pauses FREE-tier projects after ~1 week of inactivity, which kills
 * every read/write in the generated app with no visible cause — users blame
 * the builder ("my app worked last week"). GET reports the state; POST with
 * action:'restore' un-pauses it via the Management API (needs OAuth).
 */

export const maxDuration = 30

const PLATFORM_REF = (() => {
  const m = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').match(/https:\/\/([a-z0-9]+)\.supabase/i)
  return m ? m[1] : ''
})()

// Map the Management API's project status to what the UI cares about.
function mapStatus(s: string): 'ok' | 'paused' | 'restoring' | 'unknown' {
  if (s === 'ACTIVE_HEALTHY') return 'ok'
  if (s === 'INACTIVE' || s === 'PAUSED' || s === 'PAUSING' || s === 'PAUSE_FAILED') return 'paused'
  if (s === 'COMING_UP' || s === 'RESTORING' || s === 'RESTARTING') return 'restoring'
  return 'unknown'
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = new URL(req.url).searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const conn = await getAnonConnector(supabase, projectId, user.id)
  if (!conn) return NextResponse.json({ status: 'not-connected' })

  // Preferred: authoritative status from the Management API.
  const token = await getMgmtToken(supabase, projectId, user.id)
  if (token && conn.ref) {
    try {
      const p = await getProject(token, conn.ref)
      return NextResponse.json({ status: mapStatus(p.status), raw: p.status, canRestore: true })
    } catch { /* fall through to the anon ping */ }
  }

  // Fallback: anon-key REST ping. A live project answers 200/401; a paused one
  // fails or returns a 5xx from the gateway.
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 6000)
    const res = await fetch(`${conn.url}/rest/v1/`, {
      headers: { apikey: conn.anonKey, Authorization: `Bearer ${conn.anonKey}` },
      signal: ctrl.signal,
    })
    clearTimeout(t)
    const ok = res.status === 200 || res.status === 401
    return NextResponse.json({ status: ok ? 'ok' : 'paused', canRestore: false })
  } catch {
    return NextResponse.json({ status: 'paused', canRestore: false })
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, action } = await req.json().catch(() => ({} as { projectId?: string; action?: string }))
  if (!projectId || action !== 'restore') {
    return NextResponse.json({ error: 'projectId and action:"restore" required' }, { status: 400 })
  }

  const conn = await getAnonConnector(supabase, projectId, user.id)
  if (!conn) return NextResponse.json({ error: 'Supabase is not connected for this project.' }, { status: 400 })
  if (PLATFORM_REF && conn.ref === PLATFORM_REF) {
    return NextResponse.json({ error: 'That project cannot be modified.' }, { status: 403 })
  }
  const token = await getMgmtToken(supabase, projectId, user.id)
  if (!token || !conn.ref) {
    return NextResponse.json({ restored: false, reason: 'no-oauth', error: 'Restoring needs the one-click Supabase connection — reconnect Supabase, or restore it from your Supabase dashboard.' })
  }

  try {
    await restoreProject(token, conn.ref)
    return NextResponse.json({ restored: true })
  } catch (e) {
    return NextResponse.json({ restored: false, reason: 'api-error', error: String(e).slice(0, 300) })
  }
}
