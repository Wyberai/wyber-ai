import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { nextRunAt } from '@/app/api/cron/agent-scheduler/route'
import { sendCreditLowEmail } from '@/lib/email'

const MAX_RUN_COST = 22

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getAdmin()
  const now = new Date()
  const results: { employee_id: string; action: string; reason?: string }[] = []

  const { data: due, error: dueErr } = await admin
    .from('ai_employees')
    .select('id, user_id, cron_expression, next_run_at, last_run_at, name')
    .eq('is_active', true)
    .lte('next_run_at', now.toISOString())
    .not('next_run_at', 'is', null)
    .not('cron_expression', 'is', null)

  if (dueErr) return NextResponse.json({ error: dueErr.message }, { status: 500 })
  if (!due || due.length === 0) return NextResponse.json({ fired: 0, skipped: 0, results })

  for (const emp of due) {
    // Idempotency guard
    if (emp.last_run_at) {
      const msSinceLast = now.getTime() - new Date(emp.last_run_at).getTime()
      if (msSinceLast < 55_000) {
        results.push({ employee_id: emp.id, action: 'skipped', reason: 'already_ran' })
        continue
      }
    }

    // Credit check
    const { data: profile } = await admin
      .from('profiles')
      .select('credits, email')
      .eq('id', emp.user_id)
      .single()

    if (!profile || profile.credits < MAX_RUN_COST) {
      try { await sendCreditLowEmail(profile?.email ?? '', profile?.credits ?? 0) } catch {}
      await admin.from('ai_employees').update({
        next_run_at: nextRunAt(emp.cron_expression!, now).toISOString(),
      }).eq('id', emp.id)
      results.push({ employee_id: emp.id, action: 'skipped', reason: 'low_credits' })
      continue
    }

    // Advance next_run_at before firing (idempotency)
    await admin.from('ai_employees').update({
      last_run_at: now.toISOString(),
      next_run_at: nextRunAt(emp.cron_expression!, now).toISOString(),
    }).eq('id', emp.id)

    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      await fetch(`${baseUrl}/api/ai-employees/${emp.id}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Scheduler-Secret': process.env.CRON_SECRET!,
          'X-Scheduler-User-Id': emp.user_id,
        },
      })
      results.push({ employee_id: emp.id, action: 'fired' })
    } catch (err) {
      results.push({ employee_id: emp.id, action: 'error', reason: String(err) })
    }
  }

  const fired = results.filter(r => r.action === 'fired').length
  const skipped = results.filter(r => r.action === 'skipped').length
  return NextResponse.json({ fired, skipped, results })
}
