import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getDecryptedSecret } from '@/lib/get-decrypted-secret'

async function syncToHubSpot(apiKey: string, leads: Record<string, unknown>[]): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = []
  let synced = 0
  for (const lead of leads) {
    try {
      const props: Record<string, string> = {
        email: String(lead.email ?? ''),
        firstname: String(lead.first_name ?? ''),
        lastname: String(lead.last_name ?? ''),
        company: String(lead.company_name ?? ''),
        jobtitle: String(lead.title ?? ''),
        website: String(lead.company_website ?? ''),
        wyber_icp_score: String(lead.icp_fit_score ?? ''),
        wyber_status: String(lead.status ?? ''),
      }
      const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ properties: props }),
      })
      if (!res.ok && res.status !== 409) {
        // 409 = already exists — that's fine
        const err = await res.json().catch(() => ({}))
        errors.push(`${lead.email}: ${(err as { message?: string }).message ?? res.status}`)
      } else {
        synced++
      }
    } catch (e) { errors.push(`${lead.email}: ${String(e)}`) }
  }
  return { synced, errors }
}

async function syncToSalesforce(instanceUrl: string, accessToken: string, leads: Record<string, unknown>[]): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = []
  let synced = 0
  for (const lead of leads) {
    try {
      const body = {
        LastName: String(lead.last_name ?? lead.email ?? 'Unknown'),
        FirstName: String(lead.first_name ?? ''),
        Email: String(lead.email ?? ''),
        Company: String(lead.company_name ?? 'Unknown'),
        Title: String(lead.title ?? ''),
        Website: String(lead.company_website ?? ''),
        Description: `Wyber ICP Score: ${lead.icp_fit_score ?? 'N/A'}`,
        LeadSource: 'WyberAI GTM',
      }
      const res = await fetch(`${instanceUrl}/services/data/v58.0/sobjects/Lead/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ([]))
        errors.push(`${lead.email}: ${JSON.stringify(err).slice(0, 100)}`)
      } else {
        synced++
      }
    } catch (e) { errors.push(`${lead.email}: ${String(e)}`) }
  }
  return { synced, errors }
}

export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    crm: 'hubspot' | 'salesforce'
    lead_ids?: string[]
    list_id?: string
  }

  if (!body.crm) return NextResponse.json({ error: 'crm required (hubspot | salesforce)' }, { status: 400 })

  const db = createServiceClient()
  let query = db.from('gtm_leads').select('*').eq('user_id', user.id).limit(200)
  if (body.lead_ids?.length) query = query.in('id', body.lead_ids)
  else if (body.list_id) query = query.eq('list_id', body.list_id)

  const { data: leads } = await query
  if (!leads?.length) return NextResponse.json({ error: 'No leads found' }, { status: 404 })

  if (body.crm === 'hubspot') {
    const apiKey = await getDecryptedSecret(user.id, 'HUBSPOT_ACCESS_TOKEN')
    if (!apiKey) return NextResponse.json({ error: 'HUBSPOT_ACCESS_TOKEN secret not found. Add it in Settings → Secrets.' }, { status: 400 })
    const result = await syncToHubSpot(apiKey, leads as Record<string, unknown>[])
    await db.from('gtm_crm_sync_logs').insert({ user_id: user.id, crm: 'hubspot', synced: result.synced, errors: result.errors, synced_at: new Date().toISOString() }).then(() => {}).catch(() => {})
    return NextResponse.json(result)
  }

  if (body.crm === 'salesforce') {
    const instanceUrl = await getDecryptedSecret(user.id, 'SALESFORCE_INSTANCE_URL')
    const accessToken = await getDecryptedSecret(user.id, 'SALESFORCE_ACCESS_TOKEN')
    if (!instanceUrl || !accessToken) {
      return NextResponse.json({ error: 'SALESFORCE_INSTANCE_URL and SALESFORCE_ACCESS_TOKEN secrets not found. Add them in Settings → Secrets.' }, { status: 400 })
    }
    const result = await syncToSalesforce(instanceUrl, accessToken, leads as Record<string, unknown>[])
    await db.from('gtm_crm_sync_logs').insert({ user_id: user.id, crm: 'salesforce', synced: result.synced, errors: result.errors, synced_at: new Date().toISOString() }).then(() => {}).catch(() => {})
    return NextResponse.json(result)
  }

  return NextResponse.json({ error: 'Unsupported CRM' }, { status: 400 })
}

// GET — sync history
export async function GET(_req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data } = await db.from('gtm_crm_sync_logs').select('*').eq('user_id', user.id).order('synced_at', { ascending: false }).limit(20)
  return NextResponse.json({ logs: data ?? [] })
}
