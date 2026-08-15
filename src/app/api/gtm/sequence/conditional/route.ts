import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// Evaluate sequence conditions for enrolled leads and advance/branch them
// Called by a cron or scheduler — e.g. every hour
export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { sequence_id?: string }
  const db = createServiceClient()

  // Load active enrollments
  let query = db.from('gtm_sequence_enrollments').select(`
    id, lead_id, sequence_id, current_step, status, last_action_at,
    step_results, gtm_leads!inner(email, first_name, company_name),
    gtm_sequences!inner(steps, name)
  `).eq('user_id', user.id).eq('status', 'active')

  if (body.sequence_id) query = query.eq('sequence_id', body.sequence_id)
  const { data: enrollments } = await query

  if (!enrollments?.length) return NextResponse.json({ processed: 0 })

  const advanced: string[] = []
  const branched: string[] = []

  for (const enrollment of enrollments) {
    const seq = enrollment.gtm_sequences as unknown as { steps: unknown[]; name: string }
    const steps = seq?.steps ?? []
    const currentIdx = enrollment.current_step ?? 0
    const step = steps[currentIdx] as Record<string, unknown> | undefined
    if (!step) { continue }

    const lastAt = enrollment.last_action_at ? new Date(enrollment.last_action_at) : null
    const delayHours = Number(step.delay_hours ?? 24)
    const readyAt = lastAt ? new Date(lastAt.getTime() + delayHours * 3600 * 1000) : new Date(0)
    if (new Date() < readyAt) continue

    const stepResults = (enrollment.step_results as Record<string, unknown>) ?? {}
    const prevResult = stepResults[String(currentIdx - 1)] as Record<string, unknown> | undefined

    // Check conditions — e.g. "no open" → switch to LinkedIn
    const condition = step.condition as Record<string, unknown> | undefined
    let nextIdx = currentIdx + 1
    let branch: string | null = null

    if (condition) {
      const trigger = condition.trigger as string
      const prevOpened = prevResult?.opened
      const prevReplied = prevResult?.replied

      if (trigger === 'no_open' && !prevOpened) {
        branch = condition.branch as string
        const branchIdx = steps.findIndex((s, i) => i > currentIdx && (s as Record<string, unknown>).id === branch)
        if (branchIdx !== -1) nextIdx = branchIdx
      } else if (trigger === 'no_reply' && !prevReplied) {
        branch = condition.branch as string
        const branchIdx = steps.findIndex((s, i) => i > currentIdx && (s as Record<string, unknown>).id === branch)
        if (branchIdx !== -1) nextIdx = branchIdx
      } else if (trigger === 'replied' && prevReplied) {
        // Exit sequence — lead is engaged
        await db.from('gtm_sequence_enrollments').update({
          status: 'replied',
          completed_at: new Date().toISOString(),
        }).eq('id', enrollment.id)
        await db.from('gtm_leads').update({ status: 'replied' }).eq('id', enrollment.lead_id).eq('user_id', user.id)
        continue
      }
    }

    if (nextIdx >= steps.length) {
      await db.from('gtm_sequence_enrollments').update({
        status: 'completed',
        current_step: nextIdx,
        completed_at: new Date().toISOString(),
      }).eq('id', enrollment.id)
    } else {
      await db.from('gtm_sequence_enrollments').update({
        current_step: nextIdx,
        last_action_at: new Date().toISOString(),
        branch_taken: branch,
      }).eq('id', enrollment.id)
      if (branch) branched.push(enrollment.id)
      else advanced.push(enrollment.id)
    }
  }

  return NextResponse.json({
    processed: advanced.length + branched.length,
    advanced: advanced.length,
    branched: branched.length,
  })
}
