import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { nextDueEmail, type SeqKind } from '@/lib/expo-sequence'
import { deliverExpoEmail, expoSequenceDisabled, type ExpoLeadRow } from '@/lib/expo-sequence-send'

export const maxDuration = 120

// Daily (vercel.json cron): sends each Tech Expo Gujarat lead their next due
// email (reminder, thanks, followup, and a catch-up confirmation if the
// instant one failed). One email per lead per run. See lib/expo-sequence.ts
// for the timing rules. ?dry=1 lists what WOULD be sent and sends nothing.
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (expoSequenceDisabled()) return NextResponse.json({ skipped: true, reason: 'EXPO_SEQUENCE_DISABLED' })

  const dry = req.nextUrl.searchParams.get('dry') === '1'
  const admin = await createAdminClient()

  const { data: leads, error } = await admin
    .from('expo_leads')
    .select('id, name, email, preferred_day, pain_point, status, email_opt_out, created_at')
    .not('email', 'is', null)
    .eq('email_opt_out', false)
    .neq('status', 'lost')
    .gte('created_at', '2026-11-01T00:00:00Z')
    .limit(500)
  if (error) {
    console.error('[expo-sequence] expo_leads unavailable:', error.message)
    return NextResponse.json({ skipped: true, reason: 'expo_leads unavailable' })
  }

  const ids = (leads ?? []).map((l: { id: string }) => l.id)
  const sentBy = new Map<string, Set<string>>()
  if (ids.length) {
    const { data: rows, error: sErr } = await admin.from('expo_lead_emails').select('lead_id, kind').in('lead_id', ids)
    if (sErr) {
      // Without send tracking we could re-send to everyone: stop.
      console.error('[expo-sequence] expo_lead_emails unavailable, stopping:', sErr.message)
      return NextResponse.json({ skipped: true, reason: 'expo_lead_emails unavailable' })
    }
    for (const r of rows ?? []) {
      if (!sentBy.has(r.lead_id)) sentBy.set(r.lead_id, new Set())
      sentBy.get(r.lead_id)!.add(r.kind)
    }
  }

  const now = new Date()
  const results = { sent: 0, skipped: 0, failed: 0 }
  const plan: { id: string; kind: SeqKind }[] = []
  for (const l of leads ?? []) {
    const kind = nextDueEmail(l, sentBy.get(l.id) ?? new Set(), now)
    if (!kind) continue
    plan.push({ id: l.id, kind })
    if (dry) continue
    const outcome = await deliverExpoEmail(admin, l as ExpoLeadRow, kind)
    results[outcome === 'sent' ? 'sent' : outcome === 'failed' ? 'failed' : 'skipped']++
  }

  return NextResponse.json(dry ? { dry: true, due: plan.length, plan } : { ...results, due: plan.length })
}
