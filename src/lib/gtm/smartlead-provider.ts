import type { CampaignStep, GtmSendProvider, ProviderAccount, ProviderLead } from './provider'

const BASE = 'https://server.smartlead.ai/api/v1'

export class SmartleadProvider implements GtmSendProvider {
  readonly name = 'smartlead' as const
  constructor(private apiKey: string) {}

  private async req(path: string, method = 'GET', body?: unknown): Promise<any> {
    const sep = path.includes('?') ? '&' : '?'
    const res = await fetch(`${BASE}${path}${sep}api_key=${encodeURIComponent(this.apiKey)}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    const text = await res.text()
    if (!res.ok) throw new Error(`Smartlead ${method} ${path} → ${res.status}: ${text.slice(0, 300)}`)
    try { return JSON.parse(text) } catch { return text }
  }

  async listAccounts(): Promise<ProviderAccount[]> {
    const data = await this.req('/email-accounts/')
    const items: any[] = Array.isArray(data) ? data : (data?.email_accounts || data?.items || [])
    return items.map(a => ({
      email: a.from_email ?? a.email,
      status: String(a.is_smtp_success === false ? 'error' : (a.status ?? 'active')),
      warmupEnabled: a.warmup_details?.warmup_enabled === true || a.warmup_enabled === true,
      warmupScore: typeof a.warmup_details?.warmup_reputation === 'number' ? a.warmup_details.warmup_reputation : null,
      dailyLimit: typeof a.message_per_day === 'number' ? a.message_per_day : null,
    }))
  }

  async setWarmup(accountEmail: string, enabled: boolean): Promise<void> {
    // The API keys accounts by numeric id, not email — resolve it first.
    const data = await this.req('/email-accounts/')
    const items: any[] = Array.isArray(data) ? data : (data?.email_accounts || data?.items || [])
    const account = items.find(a => (a.from_email ?? a.email) === accountEmail)
    if (!account?.id) throw new Error(`Smartlead setWarmup: account not found for ${accountEmail}`)
    await this.req(`/email-accounts/${account.id}/warmup`, 'POST', {
      warmup_enabled: enabled,
      total_warmup_per_day: 20,
      daily_rampup: 2,
      reply_rate_percentage: 30,
    })
  }

  async createCampaign(opts: { name: string; steps: CampaignStep[]; accountEmails?: string[]; dailyLimit?: number; timezone?: string }): Promise<{ id: string }> {
    const created = await this.req('/campaigns/create', 'POST', { name: opts.name })
    const id = created?.id ?? created?.campaign_id
    if (!id) throw new Error(`Smartlead createCampaign: no id in response ${JSON.stringify(created).slice(0, 200)}`)

    await this.req(`/campaigns/${id}/sequences`, 'POST', {
      sequences: opts.steps.map((s, i) => ({
        seq_number: i + 1,
        seq_delay_details: { delay_in_days: i === 0 ? 0 : (s.delayDays ?? 3) },
        variant_distribution_type: 'MANUAL_EQUAL',
        variants: [{ subject: s.subject, email_body: s.body, variant_label: 'A' }],
      })),
    })

    const tz = opts.timezone || 'Asia/Kolkata'
    await this.req(`/campaigns/${id}/schedule`, 'POST', {
      timezone: tz,
      days_of_the_week: [1, 2, 3, 4, 5],
      start_hour: '09:00',
      end_hour: '17:00',
      min_time_btwn_emails: 10,
      max_new_leads_per_day: opts.dailyLimit ?? 30,
    })

    if (opts.accountEmails?.length) {
      const idsByEmail = new Map<string, number>()
      const raw = await this.req('/email-accounts/')
      const items: any[] = Array.isArray(raw) ? raw : (raw?.email_accounts || raw?.items || [])
      for (const a of items) idsByEmail.set(a.from_email ?? a.email, a.id)
      const email_account_ids = opts.accountEmails.map(e => idsByEmail.get(e)).filter((v): v is number => typeof v === 'number')
      if (email_account_ids.length) {
        await this.req(`/campaigns/${id}/email-accounts`, 'POST', { email_account_ids })
      }
    }

    return { id: String(id) }
  }

  async addLeads(campaignId: string, leads: ProviderLead[]): Promise<{ added: number; errors: string[] }> {
    let added = 0
    const errors: string[] = []
    const CHUNK = 400 // Smartlead's documented per-request max
    for (let i = 0; i < leads.length; i += CHUNK) {
      const chunk = leads.slice(i, i + CHUNK)
      try {
        const data = await this.req(`/campaigns/${campaignId}/leads`, 'POST', {
          lead_list: chunk.map(l => ({
            email: l.email,
            first_name: l.firstName,
            last_name: l.lastName,
            company_name: l.companyName,
            custom_fields: { personalization: l.personalization, ...l.variables },
          })),
          settings: {
            ignore_global_block_list: false,
            ignore_unsubscribe_list: false,
            ignore_duplicate_leads_in_other_campaign: true,
            ignore_community_bounce_list: false,
          },
        })
        added += typeof data?.upload_count === 'number' ? data.upload_count : chunk.length
      } catch (e) {
        for (const l of chunk) errors.push(`${l.email}: ${String(e).slice(0, 200)}`)
      }
    }
    return { added, errors }
  }

  async setCampaignStatus(campaignId: string, status: 'active' | 'paused'): Promise<void> {
    await this.req(`/campaigns/${campaignId}/status`, 'POST', {
      status: status === 'active' ? 'START' : 'PAUSED',
    })
  }

  async campaignStats(campaignId: string): Promise<unknown> {
    try {
      return await this.req(`/campaigns/${campaignId}/statistics`)
    } catch {
      return await this.req(`/campaigns/${campaignId}`)
    }
  }
}
