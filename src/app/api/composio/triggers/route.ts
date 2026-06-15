import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { Composio } from '@composio/core'

const TRIGGER_SLUG = 'GMAIL_NEW_GMAIL_MESSAGE'

function getAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET /api/composio/triggers?agentId=flow:xxx&projectId=xxx
// Returns the active trigger subscription for this agent, if any
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agentId = req.nextUrl.searchParams.get('agentId')
  if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 })

  const admin = getAdmin()
  const { data: sub } = await admin
    .from('composio_trigger_subscriptions')
    .select('trigger_id, trigger_slug, source_type, is_active, daily_cap, created_at')
    .eq('user_id', user.id)
    .eq('agent_id', agentId)
    .single()

  return NextResponse.json({ subscription: sub ?? null })
}

// POST /api/composio/triggers
// Body: { agentId, projectId?, sourceType: 'gmail_new_email' }
// Creates a Composio trigger instance and stores the subscription
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { agentId, projectId, sourceType } = await req.json()
  if (!agentId || sourceType !== 'gmail_new_email') {
    return NextResponse.json({ error: 'agentId and sourceType=gmail_new_email required' }, { status: 400 })
  }

  const apiKey = process.env.COMPOSIO_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'COMPOSIO_API_KEY not configured' }, { status: 503 })

  const composio = new Composio({ apiKey })

  try {
    // Create trigger instance on Composio — uses the user's connected Gmail account
    const result = await composio.triggers.create(user.id, TRIGGER_SLUG, {})
    const triggerId = result.triggerId

    if (!triggerId) throw new Error('No triggerId returned from Composio')

    const admin = getAdmin()

    // Upsert subscription record
    const { error: upsertErr } = await admin
      .from('composio_trigger_subscriptions')
      .upsert({
        user_id:      user.id,
        trigger_id:   triggerId,
        trigger_slug: TRIGGER_SLUG,
        agent_id:     agentId,
        project_id:   projectId ?? null,
        source_type:  sourceType,
        is_active:    true,
      }, { onConflict: 'trigger_id' })

    if (upsertErr) throw upsertErr

    return NextResponse.json({ ok: true, triggerId })
  } catch (err) {
    console.error('[composio/triggers POST] error:', err)
    const msg = String(err)
    if (msg.includes('connected account') || msg.includes('ConnectedAccount')) {
      return NextResponse.json({
        error: 'Gmail not connected. Connect Gmail in Settings → Integrations first.',
        code: 'no_gmail_connection',
      }, { status: 422 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/composio/triggers?agentId=xxx
// Deletes the Composio trigger instance and removes the subscription
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agentId = req.nextUrl.searchParams.get('agentId')
  if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 })

  const admin = getAdmin()

  const { data: sub } = await admin
    .from('composio_trigger_subscriptions')
    .select('trigger_id')
    .eq('user_id', user.id)
    .eq('agent_id', agentId)
    .single()

  if (!sub) return NextResponse.json({ ok: true }) // already gone

  const apiKey = process.env.COMPOSIO_API_KEY
  if (apiKey) {
    const composio = new Composio({ apiKey })
    try {
      await composio.triggers.delete(sub.trigger_id)
    } catch (err) {
      // Log but don't fail — Composio trigger may already be deleted
      console.warn('[composio/triggers DELETE] Composio delete failed (ignoring):', err)
    }
  }

  await admin
    .from('composio_trigger_subscriptions')
    .delete()
    .eq('trigger_id', sub.trigger_id)

  return NextResponse.json({ ok: true })
}
