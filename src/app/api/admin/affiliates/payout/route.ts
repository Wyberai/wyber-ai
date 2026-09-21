import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'

// Marks every currently-pending commission for one affiliate as paid, and
// moves the total from affiliate_pending_usd to affiliate_paid_usd. Dodo has
// no split-payment/payout API (verified — see src/lib/affiliate.ts), so the
// actual money transfer happens outside WyberAi; this just records that it
// happened. Recomputes the payout total itself from `affiliate_commissions`
// rather than trusting whatever total the admin dashboard last rendered —
// avoids paying out a stale amount if a new commission accrued between page
// load and this click.
export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await req.json().catch(() => ({})) as { userId?: string }
  if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 })

  const db = createServiceClient()

  const { data: affiliate } = await db.from('affiliates').select('id').eq('user_id', userId).maybeSingle()
  if (!affiliate) return NextResponse.json({ error: 'Not an affiliate' }, { status: 404 })

  const { data: pendingCommissions, error: fetchErr } = await db
    .from('affiliate_commissions')
    .select('id, commission_usd')
    .eq('affiliate_id', affiliate.id)
    .eq('status', 'pending')
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

  const total = (pendingCommissions ?? []).reduce((sum, c) => sum + Number(c.commission_usd), 0)
  if (total <= 0) return NextResponse.json({ error: 'Nothing pending to pay out' }, { status: 400 })

  const ids = (pendingCommissions ?? []).map(c => c.id)
  const { error: updErr } = await db.from('affiliate_commissions').update({ status: 'paid', updated_at: new Date().toISOString() }).in('id', ids)
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

  const { data: profile } = await db.from('profiles').select('affiliate_pending_usd, affiliate_paid_usd').eq('id', userId).maybeSingle()
  await db.from('profiles').update({
    affiliate_pending_usd: Math.max(0, Number(profile?.affiliate_pending_usd || 0) - total),
    affiliate_paid_usd: Number(profile?.affiliate_paid_usd || 0) + total,
  }).eq('id', userId)

  return NextResponse.json({ ok: true, paidOut: total, commissionCount: ids.length })
}
