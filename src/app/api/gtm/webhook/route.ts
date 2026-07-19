import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Handles inbound webhooks from Smartlead, Instantly, JustCall, Aircall.
// Each provider sends to: /api/gtm/webhook?provider=instantly&user=<user_id>
// NOTE: must use the service client — webhook requests carry no auth session,
// so the cookie-based client would be silently blocked by RLS.
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const provider = searchParams.get('provider')
  const userId = searchParams.get('user')

  if (!provider || !userId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const supabase = createServiceClient()

  // The user param is attacker-controllable; verify it's a real user before writing.
  const { data: profile } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle()
  if (!profile) return NextResponse.json({ error: 'Unknown user' }, { status: 404 })

  const body = await req.json()

  let event_type: string | null = null
  let external_campaign_id: string | null = null
  let lead_email: string | null = null
  let provider_event_id: string | null = null
  let metadata: any = {}

  if (provider === 'smartlead' || provider === 'instantly') {
    event_type = body.event_type || body.type
    lead_email = body.lead_email || body.to_email || body.email
    external_campaign_id = body.campaign_id || body.campaignId || body.campaign
    provider_event_id = body.id || body.event_id
    metadata = body
  } else if (provider === 'justcall' || provider === 'aircall') {
    event_type = body.event === 'call.completed' ? 'call_completed' : body.event?.replace('.', '_')
    lead_email = body.contact?.email || body.phone_number
    external_campaign_id = body.campaign_id
    provider_event_id = body.id || body.call_id
    metadata = body
  }

  if (!event_type) return NextResponse.json({ ok: true }) // ignore unknown events
  const normalized = String(event_type).toLowerCase().replace(/^email_/, '')

  // Providers send THEIR campaign id — map to ours via external_campaign_id.
  let campaign_id: string | null = null
  if (external_campaign_id) {
    const { data: c } = await supabase
      .from('gtm_campaigns')
      .select('id')
      .eq('user_id', userId)
      .eq('external_campaign_id', String(external_campaign_id))
      .maybeSingle()
    campaign_id = c?.id || null
  }

  const { data: lead } = await supabase
    .from('gtm_leads')
    .select('id')
    .eq('user_id', userId)
    .eq('email', (lead_email || '').toLowerCase())
    .maybeSingle()

  if (provider_event_id) {
    await supabase.from('gtm_analytics_events').upsert({
      user_id: userId,
      lead_id: lead?.id,
      campaign_id,
      event_type: normalized,
      provider,
      provider_event_id: String(provider_event_id),
      metadata,
    }, { onConflict: 'provider_event_id', ignoreDuplicates: true })
  }

  const statusMap: Record<string, string> = {
    replied: 'replied',
    reply: 'replied',
    bounce: 'bounced',
    bounced: 'bounced',
    unsubscribe: 'suppressed',
    unsubscribed: 'suppressed',
    call_completed: 'contacted',
  }
  const newStatus = statusMap[normalized]
  if (lead?.id && newStatus) {
    await supabase.from('gtm_leads').update({
      status: newStatus,
      ...(newStatus === 'suppressed' || newStatus === 'bounced'
        ? { suppressed: true, suppressed_reason: normalized }
        : {}),
    }).eq('id', lead.id)
  }

  // Suppression list: unsubscribes and bounces never get contacted again.
  if (lead_email && (normalized.includes('unsubscribe') || normalized.includes('bounce') || normalized.includes('complain'))) {
    const email = lead_email.toLowerCase()
    const { data: existing } = await supabase
      .from('gtm_suppressions')
      .select('id')
      .eq('user_id', userId)
      .eq('email', email)
      .maybeSingle()
    if (!existing) {
      await supabase.from('gtm_suppressions').insert({
        user_id: userId,
        email,
        reason: normalized.includes('bounce') ? 'bounced' : normalized.includes('complain') ? 'complained' : 'unsubscribed',
      })
    }
  }

  return NextResponse.json({ ok: true })
}
