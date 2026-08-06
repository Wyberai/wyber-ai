import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Consultations — admin', robots: { index: false, follow: false } }

// Internal view of the free US scoping-call funnel: how many booked, how many
// actually happened, how many were cancelled/no-showed. Populated by
// /api/cal/webhook (Cal.com booking events) into consultation_meetings
// (migration 20260806000000) — this page reads that table, doesn't compute
// anything itself. Will show all-zero until Cal.com webhooks are wired up
// (needs the Teams plan + CAL_WEBHOOK_SECRET — see that route's comment).
export default async function AdminConsultationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/consultations')
  if (!isAdminEmail(user.email)) redirect('/dashboard')

  const admin = await createAdminClient()
  const { data: meetings } = await admin
    .from('consultation_meetings')
    .select('cal_booking_uid, attendee_name, attendee_email, scheduled_start, status, confirmation_sent_at, reminder_1day_sent_at, reminder_30min_sent_at, thankyou_sent_at')
    .order('scheduled_start', { ascending: false })
    .limit(200)

  const rows = meetings ?? []
  const counts = {
    total: rows.length,
    scheduled: rows.filter(m => m.status === 'scheduled').length,
    completed: rows.filter(m => m.status === 'completed').length,
    cancelled: rows.filter(m => m.status === 'cancelled').length,
    noShow: rows.filter(m => m.status === 'no_show').length,
  }

  const s = { bg: '#09090b', card: '#111113', border: 'rgba(255,255,255,0.08)', text: '#fafafa', muted: '#71717a' }
  const statusColor: Record<string, string> = { scheduled: '#0EA5E9', completed: '#22c55e', cancelled: '#71717a', no_show: '#ef4444', rescheduled: '#f59e0b' }

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: 'system-ui, sans-serif', padding: '48px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>📞 Free scoping call — consultations</h1>
        <p style={{ fontSize: 13, color: s.muted, marginBottom: 24 }}>
          US-only free consultation booking funnel. Populated by Cal.com webhooks — will read as all-zero until that&apos;s configured (requires Cal.com Teams plan + <code>CAL_WEBHOOK_SECRET</code>).
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 32 }}>
          {[
            ['Total booked', counts.total, s.text],
            ['Scheduled', counts.scheduled, statusColor.scheduled],
            ['Completed', counts.completed, statusColor.completed],
            ['Cancelled', counts.cancelled, statusColor.cancelled],
            ['No-show', counts.noShow, statusColor.no_show],
          ].map(([label, value, color]) => (
            <div key={label as string} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: color as string, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
              <div style={{ fontSize: 12, color: s.muted, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${s.border}`, textAlign: 'left' }}>
                {['When', 'Name', 'Email', 'Status', 'Emails sent'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', color: s.muted, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '32px 14px', textAlign: 'center', color: s.muted }}>No bookings yet.</td></tr>
              )}
              {rows.map(m => {
                const sentCount = [m.confirmation_sent_at, m.reminder_1day_sent_at, m.reminder_30min_sent_at, m.thankyou_sent_at].filter(Boolean).length
                return (
                  <tr key={m.cal_booking_uid} style={{ borderBottom: `1px solid ${s.border}` }}>
                    <td style={{ padding: '10px 14px' }}>{new Date(m.scheduled_start).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
                    <td style={{ padding: '10px 14px' }}>{m.attendee_name || '—'}</td>
                    <td style={{ padding: '10px 14px', color: s.muted }}>{m.attendee_email}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ color: statusColor[m.status] || s.muted, fontWeight: 600 }}>{m.status}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: s.muted }}>{sentCount}/4</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
