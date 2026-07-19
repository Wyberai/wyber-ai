import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { COMMUNITY_PROGRAMS, isProgramId, type ProgramId } from '@/lib/community-programs'
import { sendCommunityApplicationAlert, sendCommunityRewardEmail } from '@/lib/email'

// Community programs: Blood Donor Bonus + Build in Public + follows/reviews.
// Credit programs whose proof is a public post (Build in Public, Product Hunt
// review) are VERIFIED server-side and auto-granted instantly — that instant
// reward is what makes the share loop actually loop. Everything else (follows,
// discount programs) still lands in the manual-review queue. See verifyProof.

// Only these hosts are fetched for verification — an allowlist, so this can
// never be turned into an SSRF (no internal hosts/IPs, https only).
const PROOF_HOSTS: Partial<Record<ProgramId, string[]>> = {
  build_in_public: ['twitter.com', 'x.com', 'www.x.com', 'linkedin.com', 'www.linkedin.com'],
  review_producthunt: ['producthunt.com', 'www.producthunt.com'],
}

// Fetch the submitted post and confirm it's a real, reachable page on an
// allowlisted social/review domain that actually references WyberAi. Anyone who
// clears this bar has performed the public post the program is paying for — the
// residual risk (someone crafting a matching page) is bounded to those hosts and
// was accepted as the tradeoff for instant gratification. Fail-safe: any doubt
// returns false and the submission falls back to manual review.
async function verifyProof(program: ProgramId, proofUrl?: string): Promise<boolean> {
  const hosts = PROOF_HOSTS[program]
  if (!hosts || !proofUrl) return false
  let u: URL
  try { u = new URL(proofUrl.trim()) } catch { return false }
  if (u.protocol !== 'https:') return false
  if (!hosts.includes(u.hostname.toLowerCase())) return false
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 6000)
    const res = await fetch(u.toString(), {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WyberAiBot/1.0; +https://wyberai.com)' },
    })
    clearTimeout(timer)
    if (!res.ok) return false
    const html = (await res.text()).toLowerCase()
    return html.includes('wyberai') || html.includes('builtonwyber')
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    program: 'blood_donor' | 'build_in_public' | 'accessibility' | 'open_source' | 'follow_linkedin' | 'follow_reddit' | 'review_producthunt'
    proof_url?: string
    proof_text?: string
  }

  if (!body.program || !isProgramId(body.program)) return NextResponse.json({ error: 'Unknown program' }, { status: 400 })

  const db = createServiceClient()

  // Check for existing submission
  const { data: existing } = await db
    .from('community_program_submissions')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('program', body.program)
    .in('status', ['pending', 'approved'])
    .limit(1)

  if (existing?.length) {
    return NextResponse.json({
      error: existing[0].status === 'approved'
        ? 'You already received this bonus.'
        : 'Your submission is pending review.',
      status: existing[0].status,
    }, { status: 400 })
  }

  const program = COMMUNITY_PROGRAMS[body.program]

  // ── Try to verify + auto-grant ──────────────────────────────────────────────
  // Only credit programs with a checkable public post are eligible. The proof
  // URL must not already have been used by another APPROVED submission (stops a
  // single viral post being farmed across accounts). If anything doesn't line
  // up, we fall through to the manual-review queue rather than deny.
  let status: 'pending' | 'approved' = 'pending'
  let granted = 0

  if (program.kind === 'credits' && program.credits > 0 && PROOF_HOSTS[body.program] && body.proof_url) {
    const { data: reused } = await db
      .from('community_program_submissions')
      .select('id')
      .eq('proof_url', body.proof_url)
      .eq('status', 'approved')
      .limit(1)

    if (!reused?.length && await verifyProof(body.program, body.proof_url)) {
      const { error: rpcErr } = await db.rpc('adjust_credits', { p_user_id: user.id, p_delta: program.credits })
      if (!rpcErr) { status = 'approved'; granted = program.credits }
    }
  }

  const { error } = await db.from('community_program_submissions').insert({
    user_id: user.id,
    program: body.program,
    proof_url: body.proof_url ?? null,
    proof_text: body.proof_text ?? null,
    bonus_type: program.note,
    status,
    granted_credits: granted || null,
    reviewed_at: status === 'approved' ? new Date().toISOString() : null,
  })

  if (error) {
    // If the insert fails after we granted, claw the credits back so a DB error
    // can't leave a free grant with no record of it.
    if (granted) await db.rpc('adjust_credits', { p_user_id: user.id, p_delta: -granted }).then(() => {}, () => {})
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (status === 'approved') {
    // Instant win — tell them the credits already landed.
    if (user.email) sendCommunityRewardEmail(user.email, program.label, granted).catch(() => {})
    return NextResponse.json({ ok: true, status: 'approved', granted, message: `Verified — ${granted} credits added to your account 🎉` })
  }

  // Not auto-verified: queue it and alert the founder so nothing sits unseen.
  sendCommunityApplicationAlert({
    programLabel: program.label,
    userEmail: user.email ?? user.id,
    proofUrl: body.proof_url ?? null,
    proofText: body.proof_text ?? null,
  }).catch(() => {})

  return NextResponse.json({ ok: true, status: 'pending', message: "Submitted! We'll do what's right within 24 hours." })
}

export async function GET(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data } = await db
    .from('community_program_submissions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ submissions: data ?? [] })
}
