import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { COMMUNITY_PROGRAMS, isProgramId } from '@/lib/community-programs'
import { sendCommunityRewardEmail } from '@/lib/email'

// Approve / reject / revoke a community-program submission. Approving a
// credit-type program grants the credits atomically via adjust_credits and
// records the amount; revoking claws back exactly what was granted. Discount
// programs (accessibility, open_source, blood_donor) are marked approved but
// carry no credits — the discount itself is applied manually (Dodo coupon).
// Admin-gated + service-role, so credits can never be self-granted.
export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, action } = await req.json().catch(() => ({})) as {
    id?: string; action?: 'approve' | 'reject' | 'revoke'
  }
  if (!id || !action) return NextResponse.json({ error: 'id and action are required' }, { status: 400 })

  const db = createServiceClient()
  const { data: sub } = await db
    .from('community_program_submissions')
    .select('id, user_id, program, status, granted_credits')
    .eq('id', id)
    .single()
  if (!sub) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  if (!isProgramId(sub.program)) return NextResponse.json({ error: 'Unknown program on submission' }, { status: 400 })

  const cfg = COMMUNITY_PROGRAMS[sub.program]

  // ── Revoke: undo an approval, clawing back any credits granted ──────────────
  if (action === 'revoke') {
    if (sub.status !== 'approved') return NextResponse.json({ error: 'Only an approved submission can be revoked.' }, { status: 400 })
    if (sub.granted_credits) {
      await db.rpc('adjust_credits', { p_user_id: sub.user_id, p_delta: -sub.granted_credits })
    }
    const { error } = await db.from('community_program_submissions')
      .update({ status: 'pending', granted_credits: null, reviewed_at: null })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, status: 'pending' })
  }

  // ── Reject ──────────────────────────────────────────────────────────────────
  if (action === 'reject') {
    const { error } = await db.from('community_program_submissions')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, status: 'rejected' })
  }

  // ── Approve (grant credits for credit-type programs) ────────────────────────
  if (sub.status === 'approved') {
    return NextResponse.json({ error: 'Already approved. Revoke first to re-grant.' }, { status: 400 })
  }

  let granted = 0
  if (cfg.kind === 'credits' && cfg.credits > 0) {
    const { error: rpcErr } = await db.rpc('adjust_credits', { p_user_id: sub.user_id, p_delta: cfg.credits })
    if (rpcErr) return NextResponse.json({ error: `Credit grant failed: ${rpcErr.message}` }, { status: 500 })
    granted = cfg.credits
  }

  const { error } = await db.from('community_program_submissions')
    .update({ status: 'approved', granted_credits: granted || null, reviewed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Best-effort notification.
  try {
    const { data: profile } = await db.from('profiles').select('email').eq('id', sub.user_id).single()
    if (profile?.email) await sendCommunityRewardEmail(profile.email, cfg.label, granted, cfg.kind === 'discount' ? cfg.note : undefined)
  } catch { /* email non-critical */ }

  return NextResponse.json({ ok: true, status: 'approved', granted })
}
