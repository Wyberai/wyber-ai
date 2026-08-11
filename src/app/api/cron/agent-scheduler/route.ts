import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { creditCost } from '@/lib/credits'
import { sendCreditLowEmail } from '@/lib/email'
import { userCurrency } from '@/lib/user-currency'
import { notifyPush } from '@/lib/push'
import { internalCallHeaders } from '@/lib/internal-auth'

const ITER_COST = creditCost('execution', 'default') // 2 credits
// Worst-case cost = 1 initial call + MAX_ITERATIONS continuation calls (10) + 1 = 11 calls
const MAX_RUN_COST = ITER_COST * 11 // 22 credits — same ceiling as /api/agents/run

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(req: NextRequest) {
  // Verify this is a legitimate Vercel Cron call
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getAdmin()
  const now = new Date()
  const results: { agent_id: string; user_id: string; action: string; reason?: string }[] = []

  // ── Find all due schedules ────────────────────────────────────────────────
  // next_run_at <= now AND is_active — the partial index makes this fast
  const { data: due, error: dueErr } = await admin
    .from('user_agent_schedules')
    .select('id, user_id, agent_id, project_id, cron_expression, next_run_at, last_run_at, schedule_max_per_day, last_input')
    .eq('is_active', true)
    .lte('next_run_at', now.toISOString())
    .not('next_run_at', 'is', null)

  if (dueErr) {
    console.error('[agent-scheduler] DB error fetching due schedules:', dueErr)
    return NextResponse.json({ error: dueErr.message }, { status: 500 })
  }

  if (!due || due.length === 0) {
    return NextResponse.json({ fired: 0, skipped: 0, results })
  }

  for (const schedule of due) {
    const tag = `[agent-scheduler] agent=${schedule.agent_id} user=${schedule.user_id}`

    // ── Idempotency: never double-fire within the same minute ─────────────
    // If last_run_at is within the last 55 seconds, this slot was already processed.
    if (schedule.last_run_at) {
      const msSinceLast = now.getTime() - new Date(schedule.last_run_at).getTime()
      if (msSinceLast < 55_000) {
        console.log(`${tag} SKIP — already ran ${msSinceLast}ms ago (idempotency)`)
        results.push({ agent_id: schedule.agent_id, user_id: schedule.user_id, action: 'skipped', reason: 'already_ran_this_slot' })
        continue
      }
    }

    // ── Hard daily cap ────────────────────────────────────────────────────
    // Count how many times this schedule fired today (UTC).
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const { count: todayCount } = await admin
      .from('agent_executions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', schedule.user_id)
      .eq('agent_id', schedule.agent_id)
      .eq('triggered_by', 'schedule')
      .gte('started_at', todayStart.toISOString())

    if ((todayCount ?? 0) >= schedule.schedule_max_per_day) {
      console.log(`${tag} SKIP — daily cap hit (${todayCount}/${schedule.schedule_max_per_day})`)
      results.push({ agent_id: schedule.agent_id, user_id: schedule.user_id, action: 'skipped', reason: 'daily_cap' })
      // Advance next_run_at to tomorrow midnight so this doesn't block the index
      await admin.from('user_agent_schedules').update({
        next_run_at: nextRunAt(schedule.cron_expression, now),
        updated_at: now.toISOString(),
      }).eq('id', schedule.id)
      continue
    }

    // ── Pre-flight credit check ───────────────────────────────────────────
    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('credits, email')
      .eq('id', schedule.user_id)
      .single()

    if (profileErr || !profile) {
      console.error(`${tag} SKIP — could not read profile:`, profileErr)
      results.push({ agent_id: schedule.agent_id, user_id: schedule.user_id, action: 'skipped', reason: 'profile_read_error' })
      continue
    }

    if (profile.credits < MAX_RUN_COST) {
      console.log(`${tag} SKIP — insufficient credits (${profile.credits} < ${MAX_RUN_COST})`)

      // Notify via email + in-app notification
      try {
        await sendCreditLowEmail(profile.email, profile.credits, await userCurrency(admin, schedule.user_id))
      } catch (emailErr) {
        console.error(`${tag} email send failed:`, emailErr)
      }

      await Promise.all([
        admin.from('notifications').insert({
          user_id: schedule.user_id,
          type: 'scheduled_agent_skipped',
          payload: {
            agent_id: schedule.agent_id,
            credits_balance: profile.credits,
            credits_needed: MAX_RUN_COST,
            upgrade_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
          },
        }),
        // Advance next_run_at so the row doesn't block the queue permanently
        admin.from('user_agent_schedules').update({
          next_run_at: nextRunAt(schedule.cron_expression, now),
          updated_at: now.toISOString(),
        }).eq('id', schedule.id),
      ])

      // Best-effort push to the companion app (never blocks the queue).
      await notifyPush(admin, schedule.user_id, 'scheduled_agent_skipped', {
        agent_id: schedule.agent_id,
        upgrade_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      })

      results.push({ agent_id: schedule.agent_id, user_id: schedule.user_id, action: 'skipped', reason: 'low_credits' })
      continue
    }

    // ── Fire the agent ────────────────────────────────────────────────────
    // Mark last_run_at and advance next_run_at BEFORE firing so a slow run
    // doesn't cause a double-fire if the next cron tick catches up.
    await admin.from('user_agent_schedules').update({
      last_run_at: now.toISOString(),
      next_run_at: nextRunAt(schedule.cron_expression, now),
      updated_at: now.toISOString(),
    }).eq('id', schedule.id)

    // Route to the correct run endpoint:
    //   flow:<uuid>  → canvas flow  → /api/canvas/run
    //   WYBER-xxx    → gallery agent → /api/agents/run
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      const isFlow = schedule.agent_id.startsWith('flow:')
      const flowId = isFlow ? schedule.agent_id.slice(5) : null
      const endpoint = isFlow ? `${baseUrl}/api/canvas/run` : `${baseUrl}/api/agents/run`

      const body = isFlow
        ? { flowId, triggeredBy: 'schedule' }
        : { agentId: schedule.agent_id, projectId: schedule.project_id, input: schedule.last_input || '', triggeredBy: 'schedule' }

      const runRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...internalCallHeaders(schedule.user_id) },
        body: JSON.stringify(body),
      })

      const runData = await runRes.json()
      console.log(`${tag} FIRED — status=${runRes.status} credits_remaining=${runData.credits_remaining}`)
      results.push({ agent_id: schedule.agent_id, user_id: schedule.user_id, action: 'fired' })
    } catch (fireErr) {
      console.error(`${tag} FIRE ERROR:`, fireErr)
      results.push({ agent_id: schedule.agent_id, user_id: schedule.user_id, action: 'error', reason: String(fireErr) })
    }
  }

  const fired   = results.filter(r => r.action === 'fired').length
  const skipped = results.filter(r => r.action === 'skipped').length
  const errored = results.filter(r => r.action === 'error').length
  console.log(`[agent-scheduler] done — fired=${fired} skipped=${skipped} errors=${errored}`)

  return NextResponse.json({ fired, skipped, errored, results })
}

// ── Minimal 5-field cron parser ───────────────────────────────────────────────
// Supports: * and */n and single integers. Handles the presets we expose in UI.
// For anything complex, npm/cron-parser is the right answer — but for 4 presets
// this avoids adding a dependency.
export function nextRunAt(expr: string, from: Date): Date {
  const [minF, hourF, domF, monF, dowF] = expr.trim().split(/\s+/)

  const next = new Date(from)
  next.setSeconds(0, 0)
  next.setMinutes(next.getMinutes() + 1) // always at least 1 minute in the future

  // Try up to 366 days to find the next matching slot
  for (let i = 0; i < 366 * 24 * 60; i++) {
    if (
      fieldMatch(next.getUTCMinutes(),     minF)  &&
      fieldMatch(next.getUTCHours(),       hourF) &&
      fieldMatch(next.getUTCDate(),        domF)  &&
      fieldMatch(next.getUTCMonth() + 1,  monF)  &&
      fieldMatch(next.getUTCDay(),         dowF)
    ) {
      return next
    }
    next.setMinutes(next.getMinutes() + 1)
  }

  // Fallback: 24 h from now (should never reach here with valid cron)
  return new Date(from.getTime() + 86_400_000)
}

function fieldMatch(value: number, field: string): boolean {
  if (field === '*') return true
  if (field.startsWith('*/')) {
    const step = parseInt(field.slice(2), 10)
    return value % step === 0
  }
  return parseInt(field, 10) === value
}
