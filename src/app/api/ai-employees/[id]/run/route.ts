import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { runEmployee } from '@/lib/ai-employees/run-engine'
import { sendAIEmployeeDigestEmail, sendAIEmployeeFailedEmail } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Allow both user-authenticated calls and internal scheduler calls
  const schedulerSecret = req.headers.get('X-Scheduler-Secret')
  const isScheduler = schedulerSecret === process.env.CRON_SECRET

  let userId: string

  if (isScheduler) {
    const schedulerUserId = req.headers.get('X-Scheduler-User-Id')
    if (!schedulerUserId) return NextResponse.json({ error: 'Missing user id' }, { status: 400 })
    userId = schedulerUserId
  } else {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = user.id
  }

  const db = createServiceClient()
  const { data: employee, error } = await db
    .from('ai_employees')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !employee) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const triggeredBy = isScheduler ? 'schedule' : 'manual'
  const startedAt = Date.now()

  const result = await runEmployee(employee, triggeredBy)
  const durationMs = Date.now() - startedAt

  // Get the run id for email link
  const { data: latestRun } = await db
    .from('ai_employee_runs')
    .select('id')
    .eq('employee_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Get user email for digest
  const { data: profile } = await db
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single()

  if (profile?.email) {
    if (result.error) {
      sendAIEmployeeFailedEmail(profile.email, employee, result.error).catch(() => {})
    } else {
      sendAIEmployeeDigestEmail(profile.email, employee, {
        summary: result.summary,
        actionsTaken: result.actionsTaken,
        kpiResults: result.kpiResults,
        creditsUsed: result.creditsUsed,
        durationMs,
        runId: latestRun?.id ?? '',
      }).catch(() => {})
    }
  }

  return NextResponse.json({ success: !result.error, result, durationMs })
}
