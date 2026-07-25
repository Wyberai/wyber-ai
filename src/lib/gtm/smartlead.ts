// Minimal Smartlead client for the outbound-automation hooks. Campaigns here
// are created directly in Smartlead's own UI (not via this app's provider
// abstraction in gtm/provider.ts, which only wraps Instantly), so this talks
// to Smartlead's REST API directly with an API key from user_secrets.

const BASE_URL = 'https://server.smartlead.ai/api/v1'

interface SmartleadLeadCampaignData {
  campaign_id: number
  campaign_lead_map_id: number
  campaign_name: string
}

interface SmartleadLead {
  id: number
  email: string
  is_unsubscribed: boolean
  lead_campaign_data: SmartleadLeadCampaignData[]
}

/** Looks up a lead by email across every campaign in the account. Returns null if never emailed. */
export async function findSmartleadLeadByEmail(apiKey: string, email: string): Promise<SmartleadLead | null> {
  const res = await fetch(`${BASE_URL}/leads?api_key=${encodeURIComponent(apiKey)}&email=${encodeURIComponent(email.trim().toLowerCase())}`)
  if (!res.ok) return null
  const data = await res.json().catch(() => null)
  if (!data || !data.id) return null
  return data as SmartleadLead
}

/**
 * Stops all further sequence steps for `email` in every campaign it's part of.
 * Called the moment someone signs up with an address we've been emailing —
 * a converted lead should never get another follow-up.
 *
 * Best-effort: never throws. Returns which campaigns were actually stopped.
 */
export async function removeLeadFromAllCampaigns(apiKey: string, email: string): Promise<{ stopped: string[]; alreadyUnsubscribed: boolean }> {
  const stopped: string[] = []
  try {
    const lead = await findSmartleadLeadByEmail(apiKey, email)
    if (!lead) return { stopped, alreadyUnsubscribed: false }
    if (lead.is_unsubscribed) return { stopped, alreadyUnsubscribed: true }

    for (const c of lead.lead_campaign_data ?? []) {
      try {
        const res = await fetch(
          `${BASE_URL}/campaigns/${c.campaign_id}/leads/${lead.id}/unsubscribe?api_key=${encodeURIComponent(apiKey)}`,
          { method: 'POST' },
        )
        if (res.ok) stopped.push(c.campaign_name || String(c.campaign_id))
      } catch { /* best-effort per campaign */ }
    }
    return { stopped, alreadyUnsubscribed: false }
  } catch {
    return { stopped, alreadyUnsubscribed: false }
  }
}
