import { getDecryptedSecret } from '@/lib/get-decrypted-secret'
import { createServiceClient } from '@/lib/supabase/server'
import { InstantlyProvider } from './instantly'
import { SmartleadProvider } from './smartlead-provider'

export interface ProviderAccount {
  email: string
  status: string
  warmupEnabled: boolean
  warmupScore: number | null
  dailyLimit: number | null
}

export interface CampaignStep {
  subject: string
  body: string
  delayDays?: number
}

export interface ProviderLead {
  email: string
  firstName?: string
  lastName?: string
  companyName?: string
  /** Fully personalized copy, referenced from the sequence template as {{personalization}} */
  personalization?: string
  variables?: Record<string, string>
}

export interface GtmSendProvider {
  readonly name: 'instantly' | 'smartlead'
  listAccounts(): Promise<ProviderAccount[]>
  setWarmup(accountEmail: string, enabled: boolean): Promise<void>
  createCampaign(opts: { name: string; steps: CampaignStep[]; accountEmails?: string[]; dailyLimit?: number; timezone?: string }): Promise<{ id: string }>
  addLeads(campaignId: string, leads: ProviderLead[]): Promise<{ added: number; errors: string[] }>
  setCampaignStatus(campaignId: string, status: 'active' | 'paused'): Promise<void>
  campaignStats(campaignId: string): Promise<unknown>
}

/**
 * Resolve the user's send provider. Canonical store is the encrypted
 * user_secrets table (INSTANTLY_API_KEY / SMARTLEAD_API_KEY); the legacy
 * plaintext user_api_keys row (instantly_api_key) is read as a fallback so
 * keys added via the older GTM settings screen keep working.
 *
 * Instantly wins if both are connected — it's the longer-standing provider
 * and existing gtm_campaigns.external_campaign_id rows already point at it.
 */
export async function getSendProvider(userId: string): Promise<GtmSendProvider | null> {
  let instantlyKey = await getDecryptedSecret(userId, 'INSTANTLY_API_KEY')
  if (!instantlyKey) {
    const db = createServiceClient()
    const { data } = await db
      .from('user_api_keys')
      .select('key_value')
      .eq('user_id', userId)
      .eq('key_name', 'instantly_api_key')
      .maybeSingle()
    instantlyKey = data?.key_value || null
  }
  if (instantlyKey) return new InstantlyProvider(instantlyKey)

  const smartleadKey = await getDecryptedSecret(userId, 'SMARTLEAD_API_KEY')
  if (smartleadKey) return new SmartleadProvider(smartleadKey)

  return null
}
