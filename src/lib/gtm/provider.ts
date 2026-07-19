import { getDecryptedSecret } from '@/lib/get-decrypted-secret'
import { createServiceClient } from '@/lib/supabase/server'
import { InstantlyProvider } from './instantly'

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
 * user_secrets table (INSTANTLY_API_KEY); the legacy plaintext
 * user_api_keys row (instantly_api_key) is read as a fallback so keys
 * added via the older GTM settings screen keep working.
 */
export async function getSendProvider(userId: string): Promise<GtmSendProvider | null> {
  let key = await getDecryptedSecret(userId, 'INSTANTLY_API_KEY')
  if (!key) {
    const db = createServiceClient()
    const { data } = await db
      .from('user_api_keys')
      .select('key_value')
      .eq('user_id', userId)
      .eq('key_name', 'instantly_api_key')
      .maybeSingle()
    key = data?.key_value || null
  }
  if (key) return new InstantlyProvider(key)
  return null
}
