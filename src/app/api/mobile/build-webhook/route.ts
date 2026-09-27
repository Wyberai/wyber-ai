import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const MOBILE_BUILD_WEBHOOK_SECRET = process.env.MOBILE_BUILD_WEBHOOK_SECRET
const BUILD_COST = 50

// Called by the mobile-builds GitHub Actions workflow (build-artifact.yml)
// with the final status of a dispatched build. Mirrors /api/appetize/webhook,
// but keyed on our own mobile_builds row id instead of a project id, and
// refunds credits on failure the same way the route that charged them would
// have if the build had failed synchronously.
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-mobile-build-secret')
  if (!MOBILE_BUILD_WEBHOOK_SECRET || secret !== MOBILE_BUILD_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as {
    buildId?: string
    status?: 'building' | 'ready' | 'error'
    buildUrl?: string
    errorMessage?: string
  }
  const { buildId, status, buildUrl, errorMessage } = body
  if (!buildId || !status) return NextResponse.json({ error: 'buildId and status required' }, { status: 400 })

  const admin = await createAdminClient()

  const { data: build } = await admin
    .from('mobile_builds')
    .select('id, user_id, status')
    .eq('id', buildId)
    .single()
  if (!build) return NextResponse.json({ error: 'Build not found' }, { status: 404 })

  // Idempotent — the workflow may retry a callback if the first one's
  // response doesn't come back cleanly.
  if (build.status === 'ready' || build.status === 'error') {
    return NextResponse.json({ ok: true })
  }

  if (status === 'error') {
    await admin
      .from('mobile_builds')
      .update({ status: 'error', error_message: errorMessage || 'Build failed', completed_at: new Date().toISOString() })
      .eq('id', buildId)
    try {
      const { data: adjusted, error } = await admin.rpc('adjust_credits', { p_user_id: build.user_id, p_delta: BUILD_COST })
      let after = !error && typeof adjusted === 'number' ? adjusted : null
      if (after === null) {
        const { data: prof } = await admin.from('profiles').select('credits').eq('id', build.user_id).single()
        after = (prof?.credits ?? 0) + BUILD_COST
        await admin.from('profiles').update({ credits: after }).eq('id', build.user_id)
      }
      const finalCredits = after ?? BUILD_COST
      await admin.from('credit_usage').insert({ user_id: build.user_id, amount: -BUILD_COST, reason: 'refund:build-failed', credits_before: finalCredits - BUILD_COST, credits_after: finalCredits })
    } catch (e) { console.error('[mobile/build-webhook] refund failed', e) }
    return NextResponse.json({ ok: true })
  }

  if (status === 'ready') {
    await admin
      .from('mobile_builds')
      .update({ status: 'ready', build_url: buildUrl, completed_at: new Date().toISOString() })
      .eq('id', buildId)
    return NextResponse.json({ ok: true })
  }

  // status === 'building' — just an in-progress ping, nothing to persist
  // beyond what /api/mobile/status already reflects from the 'queued' default.
  await admin.from('mobile_builds').update({ status: 'building' }).eq('id', buildId)
  return NextResponse.json({ ok: true })
}
