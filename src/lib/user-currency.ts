import type { SupabaseClient } from '@supabase/supabase-js'
import { currencyForCountry, type Currency } from '@/lib/currency'

// Server-side per-user currency for lifecycle emails. Cron/webhook sends have no
// request IP, so we can't detect region live — instead we read the country we
// persisted on the profile (see auth/callback + profiles.country migration).
//
// DEPLOY-SAFE: if the `country` column doesn't exist yet (migration not applied),
// or the row/read fails for any reason, this returns 'USD' rather than throwing —
// so it's safe to ship before the migration lands. India gets ₹ once the column
// exists and the user's country has been captured on a login.
export async function userCurrency(admin: SupabaseClient, userId: string): Promise<Currency> {
  try {
    const { data, error } = await admin
      .from('profiles')
      .select('country')
      .eq('id', userId)
      .single()
    if (error || !data) return 'USD'
    return currencyForCountry((data as { country?: string | null }).country ?? null)
  } catch {
    return 'USD'
  }
}
