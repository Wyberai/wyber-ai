import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const campaign_id = searchParams.get('campaign_id')

  let query = supabase
    .from('gtm_analytics_events')
    .select('event_type, created_at, lead_id, campaign_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500)

  if (campaign_id) query = query.eq('campaign_id', campaign_id)

  const { data: events } = await query

  const counts: Record<string, number> = {}
  for (const e of events || []) {
    counts[e.event_type] = (counts[e.event_type] || 0) + 1
  }

  // Daily breakdown for last 14 days
  const daily: Record<string, Record<string, number>> = {}
  const now = Date.now()
  for (const e of events || []) {
    const day = new Date(e.created_at).toISOString().slice(0, 10)
    const daysAgo = Math.floor((now - new Date(e.created_at).getTime()) / 86400000)
    if (daysAgo > 14) continue
    if (!daily[day]) daily[day] = {}
    daily[day][e.event_type] = (daily[day][e.event_type] || 0) + 1
  }

  return NextResponse.json({ counts, daily, total: events?.length || 0 })
}
