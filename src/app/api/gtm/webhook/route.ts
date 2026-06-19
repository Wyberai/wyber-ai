import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Handles inbound webhooks from Smartlead, Instantly, JustCall, Aircall
// Each provider sends to: /api/gtm/webhook?provider=smartlead&user=<user_id>
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const provider = searchParams.get('provider')
  const userId = searchParams.get('user')

  if (!provider || !userId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const supabase = await createClient()
  const body = await req.json()

  let event_type: string | null = null
  let campaign_id: string | null = null
  let lead_email: string | null = null
  let provider_event_id: string | null = null
  let metadata: any = {}

  if (provider === 'smartlead' || provider === 'instantly') {
    event_type = body.event_type || body.type
    lead_email = body.lead_email || body.to_email || body.email
    campaign_id = body.campaign_id || body.campaignId
    provider_event_id = body.id || body.event_id
    metadata = body
  } else if (provider === 'justcall' || provider === 'aircall') {
    event_type = body.event === 'call.completed' ? 'call_completed' : body.event?.replace('.', '_')
    lead_email = body.contact?.email || body.phone_number
    campaign_id = body.campaign_id
    provider_event_id = body.id || body.call_id
    metadata = body
  }

  if (!event_type) return NextResponse.json({ ok: true }) // ignore unknown events

  // Find lead
  const { data: lead } = await supabase
    .from('gtm_leads')
    .select('id')
    .eq('user_id', userId)
    .eq('email', lead_email || '')
    .single()

  // Log analytics event (deduplicated by provider_event_id)
  if (provider_event_id) {
    await supabase.from('gtm_analytics_events').upsert({
      user_id: userId,
      lead_id: lead?.id,
      campaign_id,
      event_type,
      provider,
      provider_event_id,
      metadata,
    }, { onConflict: 'provider_event_id', ignoreDuplicates: true })
  }

  // Update lead status based on event
  if (lead?.id) {
    const statusMap: Record<string, string> = {
      email_replied: 'replied',
      reply: 'replied',
      REPLIED: 'replied',
      call_completed: 'contacted',
    }
    const newStatus = statusMap[event_type]
    if (newStatus) {
      await supabase.from('gtm_leads').update({ status: newStatus }).eq('id', lead.id)
    }
  }

  return NextResponse.json({ ok: true })
}
