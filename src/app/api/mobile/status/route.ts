import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const EAS_API_BASE = 'https://api.expo.io'

/**
 * GET /api/mobile/status?buildId=xxx&platform=apk|ipa
 *
 * Poll the status of a mobile build and update the database with
 * the latest status from Expo EAS.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const buildId = searchParams.get('buildId')
    const platform = searchParams.get('platform')

    if (!buildId || !platform) {
      return NextResponse.json({ error: 'buildId and platform required' }, { status: 400 })
    }

    if (!['apk', 'ipa'].includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }

    const admin = await createAdminClient()

    // Get build record (verify ownership)
    const { data: build } = await admin
      .from('mobile_builds')
      .select('id, user_id, eas_build_id, status, build_url, error_message, platform')
      .eq('id', buildId)
      .eq('user_id', user.id)
      .single()

    if (!build) return NextResponse.json({ error: 'Build not found' }, { status: 404 })

    // If already ready or errored, return cached status
    if (build.status === 'ready' || build.status === 'error') {
      return NextResponse.json({
        status: build.status,
        platform: build.platform,
        buildUrl: build.build_url,
        errorMessage: build.error_message,
      })
    }

    // Poll EAS API for current build status
    if (!build.eas_build_id) {
      return NextResponse.json({ error: 'No EAS build ID found' }, { status: 400 })
    }

    const { data: githubConn } = await admin
      .from('github_connections')
      .select('access_token')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!githubConn?.access_token) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 403 })
    }

    try {
      const easRes = await fetch(`${EAS_API_BASE}/v2/builds/${build.eas_build_id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${githubConn.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!easRes.ok) {
        console.error('[mobile/status] EAS API error:', easRes.status)
        return NextResponse.json({
          status: build.status,
          platform: build.platform,
          buildUrl: build.build_url,
          errorMessage: build.error_message,
        })
      }

      const easBuild = await easRes.json() as {
        status?: string
        artifacts?: { buildUrl?: string }
      }

      let newStatus = build.status
      let buildUrl = build.build_url
      let errorMessage = build.error_message

      // Map EAS statuses to our statuses
      if (easBuild.status === 'FINISHED') {
        if (easBuild.artifacts?.buildUrl) {
          newStatus = 'ready'
          buildUrl = easBuild.artifacts.buildUrl
        } else {
          newStatus = 'error'
          errorMessage = 'Build succeeded but no download URL returned from EAS'
        }
      } else if (easBuild.status === 'ERRORED' || easBuild.status === 'CANCELED') {
        newStatus = 'error'
        errorMessage = `Build ${easBuild.status}`
      }

      // Update database if status changed
      if (newStatus !== build.status) {
        await admin
          .from('mobile_builds')
          .update({
            status: newStatus,
            build_url: buildUrl,
            error_message: errorMessage,
            completed_at: (newStatus === 'ready' || newStatus === 'error') ? new Date().toISOString() : null,
          })
          .eq('id', buildId)
      }

      return NextResponse.json({
        status: newStatus,
        platform: build.platform,
        buildUrl,
        errorMessage,
      })
    } catch (err) {
      console.error('[mobile/status] EAS poll error:', err)
      // Return last known status
      return NextResponse.json({
        status: build.status,
        platform: build.platform,
        buildUrl: build.build_url,
        errorMessage: build.error_message,
      })
    }
  } catch (err) {
    console.error('[mobile/status] error', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
