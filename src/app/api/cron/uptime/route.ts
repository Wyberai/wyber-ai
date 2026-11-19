import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendHealthAlert } from '@/lib/email'
import { alertText, checkHealth, decideUptimeAction, minutesBetween, statelessShouldAlert, type UptimeState } from '@/lib/ops/uptime'

export const maxDuration = 60

// Every 5 minutes (vercel.json). Checks that the email service answers, and emails the founder (through the Resend
// fallback) when it goes down, hourly while it stays down, and when it recovers. ?dry=1 reports and sends nothing.
// Off with UPTIME_DISABLED=true. State lives in the uptime_state table; without it, an alert goes out at most once an hour.
const KEY = 'continuum'

function healthUrl(): string {
  const send = process.env.CONTINUUM_API_URL ?? 'https://api.continuumapi.com/v1/send'
  try { return new URL('/health', send).toString() } catch { return 'https://api.continuumapi.com/health' }
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (process.env.UPTIME_DISABLED === 'true') return NextResponse.json({ skipped: true, reason: 'UPTIME_DISABLED' })
  const dry = req.nextUrl.searchParams.get('dry') === '1'

  const url = healthUrl()
  const now = new Date()
  const { ok, detail } = await checkHealth(url)

  // Load the previous state, if the table exists.
  let prev: UptimeState | null = null
  let stateful = true
  const admin = await createAdminClient()
  try {
    const { data, error } = await admin.from('uptime_state').select('status, since, last_alert_at').eq('key', KEY).maybeSingle()
    if (error) throw error
    if (data) prev = { status: data.status as 'up' | 'down', since: data.since as string, lastAlertAt: (data.last_alert_at as string | null) ?? null }
  } catch {
    stateful = false
  }

  let action = 'none' as ReturnType<typeof decideUptimeAction>['action']
  let next: UptimeState | null = null
  if (stateful) {
    const d = decideUptimeAction(prev, ok, now)
    action = d.action
    next = d.next
  } else if (statelessShouldAlert(ok, now)) {
    action = 'alert-down'
  }

  if (dry) return NextResponse.json({ ok, detail, url, stateful, prev, action })

  if (action !== 'none') {
    const downFor = prev?.since ? minutesBetween(prev.since, now) : undefined
    const msg = alertText(action, { url, detail, downFor })
    try {
      await sendHealthAlert({ subject: msg.subject, text: msg.text })
    } catch (e) {
      // If even the fallback fails there is nothing left to send with; log loudly so it shows in Vercel.
      console.error('[uptime] alert could not be sent:', e instanceof Error ? e.message : e)
    }
  }

  if (stateful && next) {
    try {
      await admin.from('uptime_state').upsert({ key: KEY, status: next.status, since: next.since, last_alert_at: next.lastAlertAt, updated_at: now.toISOString() })
    } catch (e) {
      console.error('[uptime] could not save state:', e instanceof Error ? e.message : e)
    }
  }

  return NextResponse.json({ ok, detail, action, stateful })
}
