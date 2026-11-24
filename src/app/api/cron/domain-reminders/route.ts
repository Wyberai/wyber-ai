import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/transport'
import { remindersDue, reminderMail, type ExpiryRow } from '@/lib/domains/reminders'
import { healDomain } from '@/lib/domains/heal'
import { context } from '@/lib/domains/route-helpers'

export const maxDuration = 60

// Daily (vercel.json): emails 30, 14, 7 and 1 days before a domain or Workspace order expires, once per threshold.
// ?dry=1 returns what would be sent and sends nothing.
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const dry = req.nextUrl.searchParams.get('dry') === '1'
  const admin = await createAdminClient()
  const horizon = new Date(Date.now() + 31 * 86_400_000).toISOString()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wyberai.com'
  const sent: string[] = []
  // First finish any domain whose connection or expiry date was not ready when it was bought (a new .in order is not
  // Active straight away). Skipped on a dry run, and when domains are not configured.
  const healed: string[] = []
  if (!dry) {
    const ctx = await context()
    if (ctx) {
      const { data: pending } = await admin.from('managed_domains').select('domain,rc_order_id,project_id,dns_written,expires_at')
        .or('dns_written.eq.false,expires_at.is.null').order('created_at', { ascending: false }).limit(15)
      for (const d of pending ?? []) {
        try { const r = await healDomain({ provider: ctx.provider, admin: ctx.admin, store: ctx.store }, d); healed.push(`${d.domain}:${r.dnsWritten ? 'ok' : 'pending'}`) }
        catch (e) { console.error('[domain-reminders] heal failed', d.domain, e instanceof Error ? e.message : e) }
      }
    }
  }
  for (const [table, kind] of [['managed_domains', 'domain'], ['workspace_subscriptions', 'workspace']] as const) {
    const { data } = await admin.from(table).select('id,domain,expires_at,reminders_sent,user_id').lte('expires_at', horizon)
    const rows = (data ?? []) as (Omit<ExpiryRow, 'email'> & { user_id: string })[]
    const ids = [...new Set(rows.map(r => r.user_id))]
    const { data: profs } = ids.length ? await admin.from('profiles').select('id,email').in('id', ids) : { data: [] as { id: string; email: string }[] }
    const email = new Map((profs ?? []).map((p: { id: string; email: string }) => [p.id, p.email]))
    const withEmail: ExpiryRow[] = rows.map(r => ({ ...r, email: email.get(r.user_id) ?? null }))
    for (const due of remindersDue(withEmail, new Date())) {
      const mail = reminderMail(kind, due.row.domain, due.daysLeft, appUrl)
      sent.push(`${kind}:${due.row.domain}:${due.threshold}`)
      if (dry) continue
      try {
        await sendEmail({ from: 'WyberAi <hello@wyberai.com>', to: due.row.email!, subject: mail.subject, text: mail.text })
        await admin.from(table).update({ reminders_sent: [...(due.row.reminders_sent ?? []), due.threshold] }).eq('id', due.row.id)
      } catch (e) {
        console.error('[domain-reminders] send failed', due.row.domain, e instanceof Error ? e.message : e)
      }
    }
  }
  return NextResponse.json({ ok: true, dry, sent, healed })
}
