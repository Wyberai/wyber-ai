import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { creditCost, PREVIEW_ACCESS_GAME_COST } from '@/lib/credits'
import { detectGame } from '@/lib/game-detect'

export async function POST(req: NextRequest) {
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { projectId } = await req.json()
    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    const admin = createServiceClient()
    const { data: project } = await admin
      .from('projects')
      .select('id, user_id, files')
      .eq('id', projectId)
      .single()
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    // Owner previewing their own project is always free — no row, no charge.
    if (project.user_id === user.id) {
      return NextResponse.json({ ok: true, free: true })
    }

    // Computed here, never trusted from the client — this determines a real
    // charge against the project OWNER's balance, and the caller (any viewer
    // with the deep link) has no reason to report it honestly.
    const isGame = detectGame(project.files)
    const cost = isGame ? PREVIEW_ACCESS_GAME_COST : creditCost('preview-access')

    const today = new Date().toISOString().slice(0, 10) // UTC calendar day, matches access_date default

    const { data: existing } = await admin
      .from('preview_sessions')
      .select('id, expires_at')
      .eq('project_id', projectId)
      .eq('viewer_id', user.id)
      .eq('access_date', today)
      .maybeSingle()

    if (existing && new Date(existing.expires_at) > new Date()) {
      return NextResponse.json({ ok: true, cached: true })
    }

    const { data: profile } = await admin.from('profiles').select('credits').eq('id', project.user_id).single()
    if ((profile?.credits ?? 0) < cost) {
      return NextResponse.json({ ok: false, gate: 'upgrade', cost }, { status: 402 })
    }

    // Claim today's slot ATOMICALLY before charging anything. The unique
    // constraint on (project_id, viewer_id, access_date) means concurrent
    // requests from the SAME viewer race here, not at the credit deduction —
    // only the request that actually inserts the row proceeds to charge;
    // every loser gets `cached: true` and never touches deduct_credits. This
    // is what closes the "fire N concurrent requests to get charged N times"
    // hole the plain SELECT-then-charge check above couldn't prevent on its own.
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const { data: claimed, error: claimErr } = await admin
      .from('preview_sessions')
      .upsert(
        {
          project_id: projectId,
          viewer_id: user.id,
          credits_charged: 0, // placeholder — set to the real cost once the charge succeeds below
          is_game: isGame,
          access_date: today,
          expires_at: expiresAt,
        },
        { onConflict: 'project_id,viewer_id,access_date', ignoreDuplicates: true },
      )
      .select('id')

    if (claimErr) {
      console.error('[preview-access] claim failed', claimErr)
      return NextResponse.json({ error: 'Preview access check failed' }, { status: 500 })
    }
    if (!claimed || claimed.length === 0) {
      // Lost the race (or a duplicate retry) — someone else's request already
      // claimed today's slot for this viewer; no charge from this request.
      return NextResponse.json({ ok: true, cached: true })
    }
    const sessionId = claimed[0].id

    const { data: deductResult, error: deductErr } = await admin.rpc('deduct_credits', {
      p_user_id: project.user_id,
      p_amount: cost,
    })
    if (deductErr || deductResult === null || deductResult?.new_credits === undefined) {
      // Compensate: release the claim so a later, legitimate attempt today
      // (e.g. after the owner tops up) isn't blocked by our own placeholder row.
      await admin.from('preview_sessions').delete().eq('id', sessionId)
      return NextResponse.json({ ok: false, gate: 'upgrade', cost }, { status: 402 })
    }

    admin.from('credit_usage').insert({
      user_id: project.user_id, amount: cost, reason: isGame ? 'preview-access-game' : 'preview-access',
      credits_before: deductResult.new_credits + cost, credits_after: deductResult.new_credits,
    }).then(() => {}, () => {})

    const { error: finalizeErr } = await admin
      .from('preview_sessions')
      .update({ credits_charged: cost })
      .eq('id', sessionId)
    if (finalizeErr) {
      console.error('[preview-access] finalize failed (charge already applied):', finalizeErr)
    }

    return NextResponse.json({ ok: true, token: sessionId, creditsCharged: cost })
  } catch (err) {
    console.error('[preview-access] error', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
