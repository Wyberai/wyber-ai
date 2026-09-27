import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/mobile/status?buildId=xxx&platform=apk|ipa
 *
 * Reads the current status of a mobile build. The build itself runs as a
 * GitHub Actions workflow that calls /api/mobile/build-webhook when it
 * finishes — this route just reflects whatever that webhook last wrote,
 * rather than polling Expo directly (there's no simple "get build by id"
 * REST call the way the old implementation here assumed).
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

    const { data: build } = await admin
      .from('mobile_builds')
      .select('id, user_id, status, build_url, error_message, platform')
      .eq('id', buildId)
      .eq('user_id', user.id)
      .single()

    if (!build) return NextResponse.json({ error: 'Build not found' }, { status: 404 })

    return NextResponse.json({
      status: build.status,
      platform: build.platform,
      buildUrl: build.build_url,
      errorMessage: build.error_message,
    })
  } catch (err) {
    console.error('[mobile/status] error', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
