import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { loadHealth } from '@/lib/ops/health-load'
import { healthText } from '@/lib/ops/health'
import { sendHealthAlert } from '@/lib/email'

export const maxDuration = 60

// Daily (vercel.json): checks the automation is still running and emails ONLY when something is wrong.
// Silence means healthy. Off with WATCHDOG_DISABLED=true. ?dry=1 returns the findings and sends nothing.
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (process.env.WATCHDOG_DISABLED === 'true') return NextResponse.json({ skipped: true, reason: 'WATCHDOG_DISABLED' })

  const dry = req.nextUrl.searchParams.get('dry') === '1'
  const issues = await loadHealth(await createAdminClient())
  if (dry || !issues.length) return NextResponse.json({ ok: true, dry, issues, text: healthText(issues) })

  const errors = issues.filter(i => i.severity === 'error').length
  try {
    await sendHealthAlert({ subject: `${errors ? 'Problem' : 'Check'}: ${issues.length} thing${issues.length === 1 ? '' : 's'} need${issues.length === 1 ? 's' : ''} attention in WyberAi`, text: healthText(issues) })
  } catch (e) {
    console.error('[watchdog] send failed:', e instanceof Error ? e.message : e)
    return NextResponse.json({ ok: false, error: 'send failed', issues }, { status: 502 })
  }
  return NextResponse.json({ ok: true, alerted: issues.length })
}
