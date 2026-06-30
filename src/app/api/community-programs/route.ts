import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// Community programs: Blood Donor Bonus + Build in Public
// Submissions are stored and manually reviewed via admin panel

export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    program: 'blood_donor' | 'build_in_public' | 'accessibility' | 'open_source' | 'follow_linkedin' | 'follow_reddit' | 'review_producthunt'
    proof_url?: string
    proof_text?: string
  }

  if (!body.program) return NextResponse.json({ error: 'program required' }, { status: 400 })

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

  const PROGRAMS: Record<string, { bonus_credits: number; bonus_type: string }> = {
    blood_donor: { bonus_credits: 0, bonus_type: '50% extra on next top-up' },
    build_in_public: { bonus_credits: 50, bonus_type: '50 bonus credits' },
    accessibility: { bonus_credits: 0, bonus_type: '50% discount on plan' },
    open_source: { bonus_credits: 0, bonus_type: '30% discount on plan' },
    follow_linkedin: { bonus_credits: 25, bonus_type: '25 bonus credits' },
    follow_reddit: { bonus_credits: 25, bonus_type: '25 bonus credits' },
    review_producthunt: { bonus_credits: 50, bonus_type: '50 bonus credits' },
  }

  // Programs that grant credits automatically once a proof URL is supplied.
  const AUTO_APPROVE = new Set(['build_in_public', 'follow_linkedin', 'follow_reddit', 'review_producthunt'])

  const program = PROGRAMS[body.program]
  if (!program) return NextResponse.json({ error: 'Unknown program' }, { status: 400 })

  const autoApprove = AUTO_APPROVE.has(body.program) && !!body.proof_url

  const { error } = await db.from('community_program_submissions').insert({
    user_id: user.id,
    program: body.program,
    proof_url: body.proof_url ?? null,
    proof_text: body.proof_text ?? null,
    bonus_type: program.bonus_type,
    status: autoApprove ? 'approved' : 'pending',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-approve credit-granting programs (just needs a valid proof URL)
  if (autoApprove && program.bonus_credits > 0) {
    const { data: profile } = await db.from('profiles').select('credits').eq('id', user.id).single()
    if (profile) {
      await db.from('profiles').update({ credits: (profile.credits ?? 0) + program.bonus_credits }).eq('id', user.id)
    }
    return NextResponse.json({ ok: true, auto_approved: true, bonus: `${program.bonus_credits} credits added`, message: `Thanks! ${program.bonus_credits} bonus credits added to your account.` })
  }

  return NextResponse.json({ ok: true, status: 'pending', message: 'Submitted! We review submissions within 24 hours.' })
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
