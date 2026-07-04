import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { COMMUNITY_PROGRAMS, isProgramId } from '@/lib/community-programs'

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

  // Every credit-granting program goes to manual review — there is no way to
  // verify a "proof_url" server-side (it used to be trusted just for being a
  // non-empty string, which meant anyone could self-grant up to 150 credits by
  // calling this endpoint directly with a fake URL). Reviewers approve/grant in
  // the admin panel (/admin/community → /api/admin/community/review).
  const { error } = await db.from('community_program_submissions').insert({
    user_id: user.id,
    program: body.program,
    proof_url: body.proof_url ?? null,
    proof_text: body.proof_text ?? null,
    bonus_type: program.note,
    status: 'pending',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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
