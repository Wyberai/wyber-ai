import type { CampaignStep, GtmSendProvider, ProviderAccount, ProviderLead } from './provider'

const BASE = 'https://api.instantly.ai/api/v2'

export class InstantlyProvider implements GtmSendProvider {
  readonly name = 'instantly' as const
  constructor(private apiKey: string) {}

  private async req(path: string, method = 'GET', body?: unknown): Promise<any> {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const text = await res.text()
    if (!res.ok) throw new Error(`Instantly ${method} ${path} → ${res.status}: ${text.slice(0, 300)}`)
    try { return JSON.parse(text) } catch { return text }
  }

  async listAccounts(): Promise<ProviderAccount[]> {
    const data = await this.req('/accounts?limit=100')
    const items: any[] = data?.items || data?.accounts || (Array.isArray(data) ? data : [])
    return items.map(a => ({
      email: a.email,
      status: String(a.status ?? ''),
      warmupEnabled: a.warmup_status === 1 || a.warmup?.enabled === true || a.warmup_enabled === true,
      warmupScore: typeof a.stat_warmup_score === 'number' ? a.stat_warmup_score : (typeof a.warmup_score === 'number' ? a.warmup_score : null),
      dailyLimit: typeof a.daily_limit === 'number' ? a.daily_limit : null,
    }))
  }

  async setWarmup(accountEmail: string, enabled: boolean): Promise<void> {
    const id = encodeURIComponent(accountEmail)
    try {
      await this.req(`/accounts/${id}/${enabled ? 'enable-warmup' : 'disable-warmup'}`, 'POST')
    } catch {
      // older shape: PATCH the account's warmup flag
      await this.req(`/accounts/${id}`, 'PATCH', { warmup: { enabled } })
    }
  }

  async createCampaign(opts: { name: string; steps: CampaignStep[]; accountEmails?: string[]; dailyLimit?: number; timezone?: string }): Promise<{ id: string }> {
    const tz = opts.timezone || 'Asia/Kolkata'
    const payload: any = {
      name: opts.name,
      campaign_schedule: {
        schedules: [{
          name: 'Business hours',
          timing: { from: '09:00', to: '17:00' },
          days: { 1: true, 2: true, 3: true, 4: true, 5: true },
          timezone: tz,
        }],
      },
      sequences: [{
        steps: opts.steps.map((s, i) => ({
          type: 'email',
          delay: i === 0 ? 0 : (s.delayDays ?? 3),
          variants: [{ subject: s.subject, body: s.body }],
        })),
      }],
      // Human-in-the-loop engine defaults: reply stops the sequence.
      stop_on_reply: true,
      link_tracking: false,
      open_tracking: true,
      daily_limit: opts.dailyLimit ?? 30,
      ...(opts.accountEmails?.length ? { email_list: opts.accountEmails } : {}),
    }
    const data = await this.req('/campaigns', 'POST', payload)
    const id = data?.id || data?.campaign_id || data?.campaign?.id
    if (!id) throw new Error(`Instantly createCampaign: no id in response ${JSON.stringify(data).slice(0, 200)}`)
    return { id: String(id) }
  }

  async addLeads(campaignId: string, leads: ProviderLead[]): Promise<{ added: number; errors: string[] }> {
    let added = 0
    const errors: string[] = []
    // Per-lead POST /leads — modest volumes (approval batches), reliable shape.
    const CONCURRENCY = 5
    for (let i = 0; i < leads.length; i += CONCURRENCY) {
      const chunk = leads.slice(i, i + CONCURRENCY)
      const results = await Promise.allSettled(chunk.map(l => this.req('/leads', 'POST', {
        campaign: campaignId,
        email: l.email,
        first_name: l.firstName,
        last_name: l.lastName,
        company_name: l.companyName,
        personalization: l.personalization,
        custom_variables: l.variables,
        skip_if_in_campaign: true,
      })))
      for (let j = 0; j < results.length; j++) {
        const r = results[j]
        if (r.status === 'fulfilled') added++
        else errors.push(`${chunk[j].email}: ${String(r.reason).slice(0, 200)}`)
      }
    }
    return { added, errors }
  }

  async setCampaignStatus(campaignId: string, status: 'active' | 'paused'): Promise<void> {
    const id = encodeURIComponent(campaignId)
    try {
      await this.req(`/campaigns/${id}/${status === 'active' ? 'activate' : 'pause'}`, 'POST')
    } catch {
      await this.req(`/campaigns/${id}`, 'PATCH', { status: status === 'active' ? 1 : 2 })
    }
  }

  async campaignStats(campaignId: string): Promise<unknown> {
    try {
      return await this.req(`/campaigns/analytics?id=${encodeURIComponent(campaignId)}`)
    } catch {
      return await this.req(`/campaigns/${encodeURIComponent(campaignId)}`)
    }
  }
}
