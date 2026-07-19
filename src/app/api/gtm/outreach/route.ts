import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSendProvider } from '@/lib/gtm/provider'

// The approval queue's API: list drafts, approve/reject/edit, push approved to the provider.

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const status = new URL(req.url).searchParams.get('status') || 'draft'
  const { data, error } = await supabase
    .from('gtm_outreach_logs')
    .select('id, status, subject, body, signal, campaign_id, lead_id, created_at, approved_at, external_id, gtm_leads(first_name, last_name, email, company_name, title)')
    .eq('user_id', user.id)
    .eq('type', 'email')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data || [] })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { ids?: string[]; id?: string; action: 'approve' | 'reject' | 'assign'; subject?: string; body?: string; campaign_id?: string }
  const ids = body.ids?.length ? body.ids : (body.id ? [body.id] : [])
  if (!ids.length || !['approve', 'reject', 'assign'].includes(body.action)) {
    return NextResponse.json({ error: 'ids + action (approve|reject|assign) required' }, { status: 400 })
  }

  if (body.action === 'assign') {
    if (!body.campaign_id) return NextResponse.json({ error: 'campaign_id required for assign' }, { status: 400 })
    const { data: c } = await supabase.from('gtm_campaigns').select('id').eq('user_id', user.id).eq('id', body.campaign_id).single()
    if (!c) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    const { error } = await supabase
      .from('gtm_outreach_logs')
      .update({ campaign_id: body.campaign_id })
      .eq('user_id', user.id)
      .in('status', ['draft', 'approved'])
      .in('id', ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, updated: ids.length })
  }

  const patch: Record<string, unknown> = {
    status: body.action === 'approve' ? 'approved' : 'rejected',
    ...(body.action === 'approve' ? { approved_at: new Date().toISOString() } : {}),
  }
  // Single-item edits may carry corrected copy
  if (ids.length === 1) {
    if (typeof body.subject === 'string') patch.subject = body.subject
    if (typeof body.body === 'string') patch.body = body.body
  }

  const { error } = await supabase
    .from('gtm_outreach_logs')
    .update(patch)
    .eq('user_id', user.id)
    .eq('status', 'draft')
    .in('id', ids)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, updated: ids.length })
}

// POST { action: 'push', campaign_id } — send every approved draft of a campaign
// to the provider as a PAUSED campaign. Nothing sends until the user activates it.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { action: string; campaign_id?: string }
  if (body.action !== 'push' || !body.campaign_id) {
    return NextResponse.json({ error: "action:'push' + campaign_id required" }, { status: 400 })
  }

  const provider = await getSendProvider(user.id)
  if (!provider) return NextResponse.json({ error: 'No send provider connected — add INSTANTLY_API_KEY in Settings → Secrets' }, { status: 400 })

  const { data: campaign } = await supabase
    .from('gtm_campaigns')
    .select('id, name, external_campaign_id')
    .eq('user_id', user.id).eq('id', body.campaign_id).single()
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

  const { data: drafts } = await supabase
    .from('gtm_outreach_logs')
    .select('id, subject, body, lead_id, gtm_leads(id, email, first_name, last_name, company_name)')
    .eq('user_id', user.id)
    .eq('campaign_id', campaign.id)
    .eq('status', 'approved')
    .limit(500)
  if (!drafts?.length) return NextResponse.json({ error: 'No approved drafts for this campaign' }, { status: 400 })

  // Suppression enforcement — hard gate before anything reaches the provider
  const { data: sup } = await supabase.from('gtm_suppressions').select('email').eq('user_id', user.id)
  const suppressed = new Set((sup || []).map(s => (s.email || '').toLowerCase()).filter(Boolean))
  const sendable = drafts.filter(d => {
    const email = (d.gtm_leads as any)?.email?.toLowerCase()
    return email && !suppressed.has(email)
  })
  const skippedSuppressed = drafts.length - sendable.length
  if (!sendable.length) return NextResponse.json({ error: 'All approved drafts are suppressed', skipped_suppressed: skippedSuppressed }, { status: 400 })

  const OPT_OUT_LINE = "P.S. Not relevant? Just reply “no thanks” and I won’t follow up."

  try {
    // One provider campaign per gtm_campaign; per-lead copy travels as variables.
    let externalId = campaign.external_campaign_id as string | null
    if (!externalId) {
      const created = await provider.createCampaign({
        name: campaign.name || 'WyberAi outreach',
        steps: [{ subject: '{{subject}}', body: '{{body}}' }],
        dailyLimit: 30,
      })
      externalId = created.id
      await supabase.from('gtm_campaigns').update({ external_campaign_id: externalId }).eq('id', campaign.id)
    }

    const result = await provider.addLeads(externalId, sendable.map(d => {
      const lead = d.gtm_leads as any
      const bodyText = (d.body || '').includes('no thanks') ? d.body! : `${d.body || ''}\n\n${OPT_OUT_LINE}`
      return {
        email: lead.email,
        firstName: lead.first_name || undefined,
        lastName: lead.last_name || undefined,
        companyName: lead.company_name || undefined,
        variables: { subject: d.subject || 'Quick question', body: bodyText },
      }
    }))

    const pushedIds = sendable.map(d => d.id)
    await supabase.from('gtm_outreach_logs')
      .update({ status: 'queued_provider', provider: provider.name, external_id: externalId })
      .eq('user_id', user.id).in('id', pushedIds)
    await supabase.from('gtm_leads')
      .update({ status: 'contacted' })
      .eq('user_id', user.id).in('id', sendable.map(d => d.lead_id).filter(Boolean))

    return NextResponse.json({
      ok: true,
      provider: provider.name,
      external_campaign_id: externalId,
      pushed: result.added,
      push_errors: result.errors,
      skipped_suppressed: skippedSuppressed,
      note: 'Provider campaign is created paused — activate it in Instantly (or via the campaign page) to start sending.',
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
