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

export async function GET() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data, error } = await db
    .from('ai_employees')
    .select('*, ai_employee_runs(id, status, summary, credits_used, started_at, finished_at, triggered_by)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .order('created_at', { referencedTable: 'ai_employee_runs', ascending: false })
    .limit(5, { referencedTable: 'ai_employee_runs' })

  if (error) {
    console.error('AI Employees fetch error:', error.message, error.code)
    if (error.message?.includes('permission denied')) {
      return NextResponse.json({ error: 'Database setup needed — please run the ai_employees migration. Contact support if this persists.' }, { status: 500 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ employees: data ?? [] })
}

export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, role, emoji = '🤖', instructions, tools = [], schedule_type = 'manual', schedule_hour = 9, schedule_day = 1 } = body

  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })
  if (!role?.trim()) return NextResponse.json({ error: 'role required' }, { status: 400 })
  if (!instructions?.trim()) return NextResponse.json({ error: 'instructions required' }, { status: 400 })

  const cronExpr = buildCron(schedule_type, schedule_hour, schedule_day)
  const nextRun = cronExpr ? nextRunAt(cronExpr, new Date()) : null

  const db = createServiceClient()

  // Ensure profile exists (FK constraint: ai_employees.user_id → profiles.id)
  await db.from('profiles').upsert({
    id: user.id,
    email: user.email,
    full_name: user.email?.split('@')[0] ?? 'User',
    credits: 50,
    plan: 'free',
  }, { onConflict: 'id', ignoreDuplicates: true })

  // If template_id provided, fetch template to pre-fill kpis
  let templateKpis = null
  if (body.template_id) {
    const { data: tpl } = await db.from('employee_templates').select('kpis').eq('id', body.template_id).single()
    if (tpl) templateKpis = tpl.kpis
  }

  const { data, error } = await db
    .from('ai_employees')
    .insert({
      user_id: user.id,
      name: name.trim(),
      role: role.trim(),
      emoji,
      instructions: instructions.trim(),
      tools,
      schedule_type,
      schedule_hour,
      schedule_day,
      cron_expression: cronExpr,
      next_run_at: nextRun?.toISOString() ?? null,
      template_id: body.template_id ?? null,
      org_id: body.org_id ?? null,
      kpis: templateKpis ?? body.kpis ?? [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ employee: data }, { status: 201 })
}
