import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { collectIncoming, loadContacts, syncIncoming } from '@/lib/crm/db'
import { buildBrief } from '@/lib/crm/brief'
import { sendCrmDailyBrief } from '@/lib/email'

export const maxDuration = 120

// Daily (vercel.json cron): refresh the CRM from every source, then email the
// founder the revenue brief. Off with CRM_BRIEF_DISABLED=true. ?dry=1 returns
// the brief text without sending anything.
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (process.env.CRM_BRIEF_DISABLED === 'true') return NextResponse.json({ skipped: true, reason: 'CRM_BRIEF_DISABLED' })

  const dry = req.nextUrl.searchParams.get('dry') === '1'
  const admin = await createAdminClient()

  // Keep the CRM fresh. Best-effort: a failed source must not stop the brief.
  let synced: { inserted: number; updated: number } | null = null
  if (!dry) {
    try {
      const { incoming } = await collectIncoming(admin)
      const r = await syncIncoming(admin, incoming)
      synced = { inserted: r.inserted, updated: r.updated }
    } catch (e) { console.error('[crm-brief] sync failed:', e instanceof Error ? e.message : e) }
  }

  let contacts
  try { contacts = await loadContacts(admin) } catch (e) {
    console.error('[crm-brief] crm_contacts unavailable:', e instanceof Error ? e.message : e)
    return NextResponse.json({ skipped: true, reason: 'crm_contacts unavailable' })
  }
  if (!contacts.length) return NextResponse.json({ skipped: true, reason: 'no contacts yet' })

  const brief = buildBrief(contacts)
  const subject = `Revenue brief: $${Math.round(brief.wonMonthUsd).toLocaleString('en-US')} won this month, ${brief.overdue} overdue, ${brief.top.length} to do first`
  if (dry) return NextResponse.json({ dry: true, subject, text: brief.text })

  try {
    await sendCrmDailyBrief({ subject, text: brief.text })
  } catch (e) {
    console.error('[crm-brief] send failed:', e instanceof Error ? e.message : e)
    return NextResponse.json({ ok: false, error: 'send failed', synced }, { status: 502 })
  }
  return NextResponse.json({ ok: true, synced, contacts: contacts.length })
}
