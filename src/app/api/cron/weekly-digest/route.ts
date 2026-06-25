import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWeeklyDigestEmail } from '@/lib/email'

export const maxDuration = 300

// Weekly "your week on WyberAi" digest for users who built something in the last 7 days.
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Pull the week's usage and aggregate per user in JS (fine at current scale).
  const { data: usage, error } = await admin
    .from('credit_usage')
    .select('user_id, amount, reason, created_at')
    .gte('created_at', since)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const BUILD_REASONS = new Set(['web-build', 'mobile-build', 'small-edit'])
  const perUser = new Map<string, { appsBuilt: number; creditsUsed: number }>()
  for (const row of usage ?? []) {
    const u = perUser.get(row.user_id) ?? { appsBuilt: 0, creditsUsed: 0 }
    u.creditsUsed += row.amount ?? 0
    if (BUILD_REASONS.has(row.reason)) u.appsBuilt += 1
    perUser.set(row.user_id, u)
  }

  const userIds = [...perUser.keys()].filter(id => (perUser.get(id)!.appsBuilt) > 0)
  if (userIds.length === 0) return NextResponse.json({ success: true, sent: 0 })

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, email, full_name, credits')
    .in('id', userIds)

  let sent = 0
  for (const p of profiles ?? []) {
    if (!p.email) continue
    const stats = perUser.get(p.id)!
    try {
      await sendWeeklyDigestEmail(p.email, (p.full_name as string) || p.email.split('@')[0], {
        appsBuilt: stats.appsBuilt,
        creditsUsed: stats.creditsUsed,
        creditsRemaining: p.credits ?? 0,
      })
      sent++
    } catch { /* skip individual failures */ }
  }

  return NextResponse.json({ success: true, sent, active: userIds.length, timestamp: new Date().toISOString() })
}
