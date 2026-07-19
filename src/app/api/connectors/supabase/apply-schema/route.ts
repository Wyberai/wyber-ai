import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnonConnector, getMgmtToken } from '@/lib/rls-scan-project'
import { runSql } from '@/lib/supabase-management'

/**
 * Auto-apply the schema SQL a build emits ("SQL TO RUN IN SUPABASE DASHBOARD"
 * comment block) against the USER'S OWN connected Supabase project, via the
 * Management API OAuth token. Before this, the SQL just scrolled by in chat and
 * nobody ran it — so every generated insert hit a missing table and the app
 * "worked on the frontend but never persisted anything".
 *
 * Requires the OAuth connection (service='supabase-oauth'); anon-key-only
 * connections get { applied: false, reason: 'no-oauth' } so the client can
 * surface the SQL as a manual step instead.
 */

export const maxDuration = 60

// Never run customer SQL against WyberAi's own platform database.
const PLATFORM_REF = (() => {
  const m = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').match(/https:\/\/([a-z0-9]+)\.supabase/i)
  return m ? m[1] : ''
})()

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, sql } = await req.json().catch(() => ({} as { projectId?: string; sql?: string }))
  if (!projectId || typeof sql !== 'string' || !sql.trim()) {
    return NextResponse.json({ error: 'projectId and sql required' }, { status: 400 })
  }
  if (sql.length > 20_000) {
    return NextResponse.json({ error: 'SQL too large' }, { status: 400 })
  }

  // Ownership is enforced by the user_id match inside these lookups.
  const conn = await getAnonConnector(supabase, projectId, user.id)
  if (!conn) return NextResponse.json({ applied: false, reason: 'not-connected' })
  if (PLATFORM_REF && conn.ref === PLATFORM_REF) {
    return NextResponse.json({ error: 'That project cannot be modified.' }, { status: 403 })
  }
  const token = await getMgmtToken(supabase, projectId, user.id)
  if (!token || !conn.ref) {
    // Distinguish "never OAuth-connected" (manual anon-key link — expected,
    // degrade to manual SQL) from "was connected but the token can't be
    // refreshed" (user revoked access in the Supabase dashboard, or the
    // refresh grant expired) — the latter needs a RECONNECT nudge or the
    // degradation is permanent and invisible.
    const { data: oauthRow } = await supabase
      .from('project_connectors')
      .select('service')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('service', 'supabase-oauth')
      .maybeSingle()
    return NextResponse.json({ applied: false, reason: oauthRow ? 'oauth-expired' : 'no-oauth' })
  }

  try {
    await runSql(token, conn.ref, sql)
    return NextResponse.json({ applied: true })
  } catch (e) {
    const msg = String(e)
    // Re-running non-idempotent statements (e.g. `create policy` that already
    // exists) is a benign no-op from the user's perspective — the schema is
    // already in place. Report it as applied so the client stays quiet.
    if (/already exists/i.test(msg)) return NextResponse.json({ applied: true, note: 'already-exists' })
    console.error('[apply-schema] failed:', msg.slice(0, 300))
    return NextResponse.json({ applied: false, reason: 'sql-error', error: msg.slice(0, 500) })
  }
}
