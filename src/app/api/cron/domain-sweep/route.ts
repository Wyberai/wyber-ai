import { NextRequest, NextResponse } from 'next/server'
import { context } from '@/lib/domains/route-helpers'
import { resumeOrder, type Order } from '@/lib/domains/orders'
import { healDomain } from '@/lib/domains/heal'
import { orderMail } from '@/lib/domains/notify'
import { sendAdminPaymentAlert } from '@/lib/email'
import { sendEmail } from '@/lib/email/transport'

export const maxDuration = 120

// Every 15 minutes (vercel.json). The safety net for money already taken:
//  1. a paid order stuck on "registering" (the payment handler was cut off) or on "needs_attention" (a provider step
//     failed, for example the balance was empty and has since been topped up) is carried on from where it stopped;
//  2. a bought domain whose DNS or expiry date was not ready (a new .in can take a while) is finished;
//  3. a person is emailed when an order stays stuck (about 30 minutes, 6 hours and 24 hours in), and once a day with any
//     checkout that was opened but never confirmed, in case a payment notice never arrived.
// ?dry=1 returns what it would do and does nothing.
const MIN = 60_000
const APP = () => process.env.NEXT_PUBLIC_APP_URL || 'https://wyberai.com'

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET || req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const dry = req.nextUrl.searchParams.get('dry') === '1'
  const ctx = await context()
  if (!ctx) return NextResponse.json({ ok: true, skipped: 'domains are not configured' })
  const { admin, provider, store } = ctx
  const now = Date.now()
  const ago = (ms: number) => new Date(now - ms).toISOString()
  const out = { resumed: [] as string[], healed: [] as string[], alerts: [] as string[] }

  // 1. Paid orders that did not finish. Capped per run so one bad order cannot use the whole time.
  const { data: stuck } = await admin.from('commerce_orders').select('id,status,domain,kind,created_at')
    .or(`and(status.eq.registering,updated_at.lt.${ago(5 * MIN)}),and(status.eq.needs_attention,updated_at.lt.${ago(10 * MIN)},created_at.gt.${ago(6 * 60 * MIN)})`)
    .order('created_at', { ascending: true }).limit(8)
  for (const o of (stuck ?? []) as { id: string; status: 'registering' | 'needs_attention'; domain: string }[]) {
    out.resumed.push(`${o.domain}:${o.status}`)
    if (dry) continue
    try {
      const r = await resumeOrder({ provider, store }, o.id, o.status)
      if (r.ran && r.ok) {
        // It finished this time: the customer has not had their confirmation yet, so send it now.
        const full = await store.getOrder(o.id)
        if (full) {
          const m = orderMail(full as Order, 'done', APP())
          await sendEmail({ from: 'WyberAi <hello@wyberai.com>', to: m.to, subject: m.subject, text: m.text }).catch(e => console.error('[domain-sweep] email failed', o.id, e instanceof Error ? e.message : e))
        }
      }
    } catch (e) { console.error('[domain-sweep] resume failed', o.id, e instanceof Error ? e.message : e) }
  }

  // 2. Bought domains whose connection or expiry date was not ready.
  const { data: pending } = await admin.from('managed_domains').select('domain,rc_order_id,project_id,dns_written,expires_at')
    .or('dns_written.eq.false,expires_at.is.null').order('created_at', { ascending: false }).limit(15)
  for (const d of pending ?? []) {
    if (dry) { out.healed.push(`${d.domain}:dry`); continue }
    try { const r = await healDomain({ provider, admin, store }, d); out.healed.push(`${d.domain}:${r.dnsWritten ? 'ok' : 'pending'}`) }
    catch (e) { console.error('[domain-sweep] heal failed', d.domain, e instanceof Error ? e.message : e) }
  }

  // 3. Tell a person. Each order is reported about once per window, so a 15 minute cadence does not repeat itself.
  const inWindow = (ageMin: number) => [[30, 45], [360, 375], [1440, 1455]].some(([a, b]) => ageMin >= a && ageMin < b)
  const { data: attention } = await admin.from('commerce_orders').select('id,domain,kind,error,created_at').eq('status', 'needs_attention').limit(50)
  const due = (attention ?? []).filter((o: { created_at: string }) => inWindow((now - new Date(o.created_at).getTime()) / MIN))
  if (due.length) {
    out.alerts.push(`needs_attention:${due.length}`)
    if (!dry) await sendAdminPaymentAlert('Domain orders need a person', due.map((o: { id: string; domain: string; kind: string; error: string | null }) => `${o.kind} ${o.domain} (order ${o.id.slice(0, 8)}): ${String(o.error ?? 'no detail').slice(0, 200)}`).join('\n') + '\n\nThe customer has paid. Finish it, or refund in Dodo. The sweep keeps retrying for 6 hours.').catch(() => {})
  }
  const d = new Date(now)
  if (d.getUTCHours() === 5 && d.getUTCMinutes() < 15) {
    const { data: unconfirmed } = await admin.from('commerce_orders').select('id,domain,kind,total_cents,created_at')
      .eq('status', 'awaiting_payment').not('dodo_checkout_id', 'is', null).gt('created_at', ago(24 * 60 * MIN)).lt('created_at', ago(45 * MIN)).limit(30)
    if (unconfirmed?.length) {
      out.alerts.push(`unconfirmed:${unconfirmed.length}`)
      if (!dry) await sendAdminPaymentAlert('Domain checkouts opened but not confirmed', unconfirmed.map((o: { id: string; domain: string; kind: string; total_cents: number }) => `${o.kind} ${o.domain} $${(o.total_cents / 100).toFixed(2)} (order ${o.id.slice(0, 8)})`).join('\n') + '\n\nMost are abandoned. If a customer says they paid, check Dodo, then the order here.').catch(() => {})
    }
  }
  return NextResponse.json({ ok: true, dry, ...out })
}
