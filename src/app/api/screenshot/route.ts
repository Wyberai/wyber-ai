import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { url, projectId } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    const SHOT_KEY = process.env.SCREENSHOTONE_KEY
    if (!SHOT_KEY) return NextResponse.json({ error: 'Screenshot service not configured' }, { status: 503 })

    // Call Screenshotone API
    const params = new URLSearchParams({
      access_key: SHOT_KEY,
      url,
      viewport_width: '1280',
      viewport_height: '720',
      device_scale_factor: '1',
      format: 'png',
      image_quality: '80',
      block_ads: 'true',
      block_cookie_banners: 'true',
      cache: 'true',
      cache_ttl: '86400',
      response_type: 'json',
    })

    const res = await fetch(`https://api.screenshotone.com/take?${params}`)
    const data = await res.json()

    if (!data.screenshot_url) {
      return NextResponse.json({ error: 'Screenshot failed' }, { status: 500 })
    }

    // Save thumbnail URL to project
    if (projectId) {
      const supabase = await createClient()
      await supabase.from('projects')
        .update({ thumbnail_url: data.screenshot_url })
        .eq('id', projectId)
    }

    return NextResponse.json({ thumbnailUrl: data.screenshot_url })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
