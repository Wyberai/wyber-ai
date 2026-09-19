import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { creditCost } from '@/lib/credits'
import { runSecurityBeastScan } from '@/lib/security-beast-scan'

// "Security Beast" scan — a comprehensive, deterministic checklist (see
// src/lib/security-beast-scan.ts) run against the project's real generated
// files, read server-side from the DB (never trusted from the client, same
// model as /api/seo/scan). Flat 100-credit charge, deducted here so the cost
// shown in the UI's confirm step is never cosmetic.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId } = await req.json()
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

    const admin = await createAdminClient()
    const { data: project, error } = await admin
      .from('projects')
      .select('files')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const cost = creditCost('security-scan')
    const { data: profile } = await admin.from('profiles').select('credits').eq('id', user.id).single()
    if ((profile?.credits ?? 0) < cost) {
      return NextResponse.json({ error: `Not enough credits — this scan costs ${cost} credits.`, gate: 'upgrade', cost }, { status: 402 })
    }

    const { data: deductResult, error: deductErr } = await admin.rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: cost,
    })
    if (deductErr || deductResult === null || deductResult?.new_credits === undefined) {
      return NextResponse.json({ error: 'Could not charge credits for this scan.', gate: 'upgrade', cost }, { status: 402 })
    }
    admin.from('credit_usage').insert({
      user_id: user.id, amount: cost, reason: 'security-beast-scan',
      credits_before: deductResult.new_credits + cost, credits_after: deductResult.new_credits,
    }).then(() => {}, () => {})

    const files: Record<string, { content?: string }> = project.files || {}
    const report = runSecurityBeastScan(files)

    return NextResponse.json({ ...report, cost, creditsRemaining: deductResult.new_credits })
  } catch (err) {
    console.error('[security/beast-scan] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
