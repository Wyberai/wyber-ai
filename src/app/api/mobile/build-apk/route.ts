import { internalSecret } from '@/lib/internal-auth'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const BUILD_COST = 50
const EAS_API_BASE = 'https://api.expo.io'

// Never charge for a build that never actually started. Same adjust_credits
// RPC (migration 20260702130000) /api/generate uses to refund failed builds,
// with the same read-then-write fallback if it's unavailable.
async function refundBuildCost(admin: ReturnType<typeof createAdminClient>, userId: string, amount: number, reason: string) {
  try {
    const { data: adjusted, error } = await admin.rpc('adjust_credits', { p_user_id: userId, p_delta: amount })
    let after = !error && typeof adjusted === 'number' ? adjusted : null
    if (after === null) {
      const { data: prof } = await admin.from('profiles').select('credits').eq('id', userId).single()
      after = (prof?.credits ?? 0) + amount
      await admin.from('profiles').update({ credits: after }).eq('id', userId)
    }
    const finalCredits = after ?? amount
    await admin.from('credit_usage').insert({ user_id: userId, amount: -amount, reason: `refund:${reason}`, credits_before: finalCredits - amount, credits_after: finalCredits })
  } catch (e) { console.error('[mobile/build-apk] refund failed', e) }
}

// This route authenticates to Expo's EAS API with the user's GitHub OAuth
// token, which is not a valid Expo credential — the EAS call 401s every time
// (no EXPO_TOKEN is configured anywhere in this project). Gated off at the
// route level, not just in the MCP tool wrapper, so the web editor's own
// Export APK button (MobilePreviewPanel.tsx) can't deduct-then-refund 50cr on
// a build that's guaranteed to fail either. Flip back on once a real build
// backend (EAS with a real token, or the GitHub-Actions self-build pattern
// the companion app moved to) is wired up here.
const MOBILE_BUILD_BACKEND_ENABLED = process.env.MOBILE_BUILD_BACKEND_ENABLED === 'true'

export async function POST(req: NextRequest) {
  if (!MOBILE_BUILD_BACKEND_ENABLED) {
    return NextResponse.json(
      { error: 'APK export isn\'t available right now — the mobile build pipeline needs a real build backend. No credits are charged. Use Export Code to download the project and build it yourself in the meantime.' },
      { status: 503 },
    )
  }

  try {
    // Internal callers (the MCP export_mobile_build tool) have no browser
    // session — same X-Scheduler-Secret/X-Scheduler-User-Id bypass as /api/publish.
    const schedulerSecret = req.headers.get('x-scheduler-secret')
    const schedulerUserId = req.headers.get('x-scheduler-user-id')
    const isInternalCall = !!schedulerUserId && schedulerSecret === internalSecret()

    let user: { id: string }
    if (isInternalCall) {
      user = { id: schedulerUserId! }
    } else {
      const auth = await createClient()
      const { data: { user: cookieUser } } = await auth.auth.getUser()
      if (!cookieUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      user = cookieUser
    }

    const { projectId } = await req.json() as { projectId?: string }
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

    const admin = await createAdminClient()

    // Verify project ownership
    const { data: project } = await admin
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    // Get user profile with credits and GitHub token
    const { data: profile } = await admin
      .from('profiles')
      .select('credits, id')
      .eq('id', user.id)
      .single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Check credits
    if (profile.credits < BUILD_COST) {
      return NextResponse.json(
        { error: 'Insufficient credits', required: BUILD_COST, available: profile.credits },
        { status: 402 },
      )
    }

    // Check for GitHub connection
    const { data: githubConn } = await admin
      .from('github_connections')
      .select('access_token')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!githubConn?.access_token) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 403 })
    }

    // Create mobile_builds record
    const { data: buildRecord, error: recordErr } = await admin
      .from('mobile_builds')
      .insert({
        project_id: projectId,
        user_id: user.id,
        platform: 'apk',
        status: 'queued',
      })
      .select('id')
      .single()

    if (recordErr || !buildRecord) {
      console.error('[mobile/build-apk] Failed to create build record:', recordErr)
      return NextResponse.json({ error: 'Failed to create build record' }, { status: 500 })
    }

    const buildId = buildRecord.id

    // Deduct credits atomically
    const { data: deductResult, error: deductErr } = await admin.rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: BUILD_COST,
    })

    if (deductErr || deductResult?.new_credits === undefined) {
      // Rollback build record
      await admin.from('mobile_builds').delete().eq('id', buildId)
      return NextResponse.json(
        { error: 'Credit deduction failed' },
        { status: 402 },
      )
    }

    // Log credit usage
    admin
      .from('credit_usage')
      .insert({
        user_id: user.id,
        amount: BUILD_COST,
        reason: 'mobile-build-apk',
        credits_before: deductResult.new_credits + BUILD_COST,
        credits_after: deductResult.new_credits,
      })
      .then(() => {}, () => {})

    // Trigger Expo EAS build
    // This calls Expo's build service using the user's GitHub token
    try {
      const easRes = await fetch(`${EAS_API_BASE}/v2/builds`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubConn.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: 'android',
          appId: `org.wyberai.builder.${projectId.slice(0, 8)}`,
          buildProfile: 'preview',
        }),
      })

      if (!easRes.ok) {
        const errText = await easRes.text()
        console.error('[mobile/build-apk] EAS API error:', errText)
        // Update build status to error
        await admin
          .from('mobile_builds')
          .update({ status: 'error', error_message: `EAS API error: ${easRes.status}` })
          .eq('id', buildId)
        await refundBuildCost(admin, user.id, BUILD_COST, 'eas-build-failed')
        return NextResponse.json(
          { error: 'Failed to start build with Expo' },
          { status: 500 },
        )
      }

      const easData = await easRes.json() as { id?: string }
      const easBuildId = easData.id

      if (!easBuildId) {
        console.error('[mobile/build-apk] No build ID from EAS response')
        await admin
          .from('mobile_builds')
          .update({ status: 'error', error_message: 'No build ID from EAS' })
          .eq('id', buildId)
        await refundBuildCost(admin, user.id, BUILD_COST, 'eas-build-failed')
        return NextResponse.json(
          { error: 'Failed to get build ID from Expo' },
          { status: 500 },
        )
      }

      // Update build record with EAS build ID
      await admin
        .from('mobile_builds')
        .update({ status: 'building', eas_build_id: easBuildId })
        .eq('id', buildId)

      return NextResponse.json({
        success: true,
        buildId,
        easBuildId,
        status: 'building',
        creditsDeducted: BUILD_COST,
      })
    } catch (err) {
      console.error('[mobile/build-apk] EAS call error:', err)
      await admin
        .from('mobile_builds')
        .update({ status: 'error', error_message: String(err) })
        .eq('id', buildId)
      await refundBuildCost(admin, user.id, BUILD_COST, 'eas-build-failed')
      return NextResponse.json({ error: 'Build initiation failed' }, { status: 500 })
    }
  } catch (err) {
    console.error('[mobile/build-apk] error', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
