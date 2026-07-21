import { createServiceClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/secrets-crypto'

/**
 * Server-only helper — never call from client components or expose via HTTP.
 * Used by agent/workflow execution routes to inject secrets at runtime.
 */
export async function getDecryptedSecret(userId: string, name: string): Promise<string | null> {
  const db = createServiceClient()
  const { data, error } = await db
    .from('user_secrets')
    .select('value_encrypted')
    .eq('user_id', userId)
    .eq('name', name)
    .single()

  if (error || !data) return null
  try {
    return decrypt(data.value_encrypted)
  } catch (e) {
    // A silent null here is indistinguishable from "this secret was never
    // set" — an agent/workflow run just quietly proceeds without a key it
    // actually needs, and whatever integration depended on it fails with no
    // clue the real cause is a broken decrypt (key rotation, corruption),
    // not a missing secret. Log it so this is at least diagnosable.
    console.error(`[get-decrypted-secret] failed to decrypt secret "${name}" for user ${userId}:`, String(e))
    return null
  }
}
