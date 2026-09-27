import { internalSecret } from '@/lib/internal-auth'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const BUILD_COST = 50

const GITHUB_BUILD_TOKEN = process.env.GITHUB_BUILD_TOKEN   // PAT with repo+workflow scope
const GITHUB_BUILD_REPO  = process.env.GITHUB_BUILD_REPO    // e.g. 'Wyberai/mobile-builds'
const MOBILE_BUILD_WEBHOOK_SECRET = process.env.MOBILE_BUILD_WEBHOOK_SECRET
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://wyberai.com'

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

// Dispatches a real build to the Wyberai/mobile-builds GitHub Actions repo
// (build-artifact.yml), which scaffolds the generated project into an Expo
// app and runs `eas build` with a real EXPO_TOKEN — same pattern already
// proven by /api/appetize/build for the Cloud Device preview. The workflow
// calls back to /api/mobile/build-webhook with the final status + download
// URL once EAS finishes (~5-10 min), instead of this route trying to poll
// or call Expo's API directly (there is no simple synchronous "create build"
// REST endpoint — that's why the old direct-fetch implementation here never
// worked, independent of which token it used).
const APK_BUILD_BACKEND_ENABLED = process.env.NEXT_PUBLIC_MOBILE_APK_BUILD_ENABLED === 'true'

export async function POST(req: NextRequest) {
  if (!APK_BUILD_BACKEND_ENABLED) {
    return NextResponse.json(
      { error: 'APK export isn\'t available right now. No credits are charged. Use Export Code to download the project and build it yourself in the meantime.' },
      { status: 503 },
    )
  }

  if (!GITHUB_BUILD_TOKEN || !GITHUB_BUILD_REPO || !MOBILE_BUILD_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Build service not configured (set GITHUB_BUILD_TOKEN + GITHUB_BUILD_REPO + MOBILE_BUILD_WEBHOOK_SECRET)' }, { status: 503 })
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

    // Verify project ownership and grab a files snapshot for the build worker
    // to fetch (shared with the Appetize preview pipeline's snapshot column —
    // both flows just need "the files as of when the build was requested").
    const { data: project } = await admin
      .from('projects')
      .select('id, user_id, files')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    // Get user profile with credits
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

    await admin.from('projects').update({ appetize_build_snapshot: project.files }).eq('id', projectId)

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

    // Dispatch the real build to GitHub Actions
    const filesUrl    = `${APP_URL}/api/appetize/files?projectId=${projectId}&secret=${encodeURIComponent(process.env.APPETIZE_BUILD_SECRET || '')}`
    const callbackUrl = `${APP_URL}/api/mobile/build-webhook`

    try {
      const ghRes = await fetch(
        `https://api.github.com/repos/${GITHUB_BUILD_REPO}/actions/workflows/build-artifact.yml/dispatches`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${GITHUB_BUILD_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ref: 'main',
            inputs: { build_id: buildId, project_id: projectId, platform: 'android', files_url: filesUrl, callback_url: callbackUrl },
          }),
        },
      )

      if (!ghRes.ok) {
        const errText = await ghRes.text()
        console.error('[mobile/build-apk] Workflow dispatch failed:', ghRes.status, errText)
        await admin
          .from('mobile_builds')
          .update({ status: 'error', error_message: `Build trigger failed: ${ghRes.status}` })
          .eq('id', buildId)
        await refundBuildCost(admin, user.id, BUILD_COST, 'dispatch-failed')
        return NextResponse.json({ error: 'Failed to start build' }, { status: 500 })
      }

      await admin.from('mobile_builds').update({ status: 'queued' }).eq('id', buildId)

      return NextResponse.json({
        success: true,
        buildId,
        status: 'queued',
        creditsDeducted: BUILD_COST,
      })
    } catch (err) {
      console.error('[mobile/build-apk] dispatch error', err)
      await admin
        .from('mobile_builds')
        .update({ status: 'error', error_message: String(err) })
        .eq('id', buildId)
      await refundBuildCost(admin, user.id, BUILD_COST, 'dispatch-failed')
      return NextResponse.json({ error: 'Build initiation failed' }, { status: 500 })
    }
  } catch (err) {
    console.error('[mobile/build-apk] error', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
