import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { nextRunAt } from '@/app/api/cron/agent-scheduler/route'

// GET  /api/agents/schedule?agentId=WYBER-079   → fetch user's schedule for this agent
// POST /api/agents/schedule                      → upsert schedule
// DELETE /api/agents/schedule?agentId=WYBER-079 → deactivate (soft delete)

export async function GET(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agentId = req.nextUrl.searchParams.get('agentId')
  if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 })

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('user_agent_schedules')
    .select('*')
    .eq('user_id', user.id)
    .eq('agent_id', agentId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ schedule: data })
}

export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { agentId, projectId, cronExpression, lastInput, scheduleMaxPerDay } = await req.json()
  if (!agentId || !projectId || !cronExpression) {
    return NextResponse.json({ error: 'agentId, projectId, cronExpression required' }, { status: 400 })
  }

  const computed = nextRunAt(cronExpression, new Date())
  const admin = await createAdminClient()

  const { data, error } = await admin
    .from('user_agent_schedules')
    .upsert({
      user_id: user.id,
      agent_id: agentId,
      project_id: projectId,
      cron_expression: cronExpression,
      next_run_at: computed.toISOString(),
      is_active: true,
      last_input: lastInput ?? null,
      schedule_max_per_day: scheduleMaxPerDay ?? 24,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,agent_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ schedule: data, next_run_at: computed.toISOString() })
}

export async function DELETE(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agentId = req.nextUrl.searchParams.get('agentId')
  if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 })

  const admin = await createAdminClient()
  const { error } = await admin
    .from('user_agent_schedules')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('agent_id', agentId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
