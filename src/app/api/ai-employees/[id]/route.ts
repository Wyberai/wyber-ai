import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { nextRunAt } from '@/app/api/cron/agent-scheduler/route'

function buildCron(scheduleType: string, scheduleHour: number, scheduleDay: number): string | null {
  if (scheduleType === 'manual') return null
  if (scheduleType === 'hourly') return '0 * * * *'
  if (scheduleType === 'daily') return `0 ${scheduleHour} * * *`
  if (scheduleType === 'weekly') return `0 ${scheduleHour} * * ${scheduleDay}`
  return null
}

async function getEmployee(id: string, userId: string) {
  const db = createServiceClient()
  const { data } = await db.from('ai_employees').select('*').eq('id', id).eq('user_id', userId).single()
  return data
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data, error } = await db
    .from('ai_employees')
    .select('*, ai_employee_runs(id, status, summary, actions_taken, credits_used, started_at, finished_at, triggered_by, error_message)')
    .eq('id', id)
    .eq('user_id', user.id)
    .order('created_at', { referencedTable: 'ai_employee_runs', ascending: false })
    .limit(20, { referencedTable: 'ai_employee_runs' })
    .single()

  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ employee: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const employee = await getEmployee(id, user.id)
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.role !== undefined) updates.role = body.role.trim()
  if (body.emoji !== undefined) updates.emoji = body.emoji
  if (body.instructions !== undefined) updates.instructions = body.instructions.trim()
  if (body.tools !== undefined) updates.tools = body.tools
  if (body.is_active !== undefined) updates.is_active = body.is_active
  if (body.company_context !== undefined) updates.company_context = body.company_context
  if (body.company_files !== undefined) updates.company_files = body.company_files
  if (body.kpis !== undefined) updates.kpis = body.kpis
  if (body.onboarding_completed !== undefined) updates.onboarding_completed = body.onboarding_completed
  if (body.org_id !== undefined) updates.org_id = body.org_id

  const st = body.schedule_type ?? employee.schedule_type
  const sh = body.schedule_hour ?? employee.schedule_hour
  const sd = body.schedule_day ?? employee.schedule_day

  if (body.schedule_type !== undefined || body.schedule_hour !== undefined || body.schedule_day !== undefined) {
    updates.schedule_type = st
    updates.schedule_hour = sh
    updates.schedule_day = sd
    const cronExpr = buildCron(st, sh, sd)
    updates.cron_expression = cronExpr
    updates.next_run_at = cronExpr ? nextRunAt(cronExpr, new Date()).toISOString() : null
  }

  const db = createServiceClient()
  const { data, error } = await db
    .from('ai_employees')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ employee: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { error } = await db.from('ai_employees').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
