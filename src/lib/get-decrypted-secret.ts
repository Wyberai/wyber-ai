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
  } catch {
    return null
  }
}
