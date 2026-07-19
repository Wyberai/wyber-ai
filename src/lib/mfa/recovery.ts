import { createServiceClient } from '@/lib/supabase/server'
import { createHash, randomBytes } from 'crypto'

const COUNT = 10

/** Normalize a code for hashing: strip dashes/spaces, lowercase. */
function normalize(code: string): string {
  return code.replace(/[\s-]/g, '').toLowerCase()
}
function hashCode(code: string): string {
  return createHash('sha256').update(normalize(code)).digest('hex')
}
/** Pretty 10-hex code as two 5-char groups, e.g. "a1b2c-3d4e5". */
function format(raw: string): string {
  return `${raw.slice(0, 5)}-${raw.slice(5)}`
}

/**
 * (Re)generate this user's recovery codes and mark 2FA enabled. Any previous
 * codes are invalidated. Returns the plaintext codes to show ONCE.
 */
export async function generateRecoveryCodes(userId: string): Promise<string[]> {
  const db = createServiceClient()
  await db.from('mfa_recovery_codes').delete().eq('user_id', userId)
  const raws = Array.from({ length: COUNT }, () => randomBytes(5).toString('hex')) // 10 hex chars each
  const { error } = await db.from('mfa_recovery_codes').insert(
    raws.map(r => ({ user_id: userId, code_hash: hashCode(r) })),
  )
  if (error) throw new Error(error.message)
  await db.from('profiles').update({ mfa_enabled: true }).eq('id', userId)
  return raws.map(format)
}

/** Turn off our 2FA bookkeeping (called when the last factor is removed). */
export async function disableMfa(userId: string): Promise<void> {
  const db = createServiceClient()
  await db.from('mfa_recovery_codes').delete().eq('user_id', userId)
  await db.from('profiles').update({ mfa_enabled: false }).eq('id', userId)
}

/**
 * Consume a single-use recovery code. The `.update(...).is('used_at', null)`
 * guard makes redemption atomic (a code can't be spent twice). Returns true iff
 * a valid, unused code matched.
 */
export async function consumeRecoveryCode(userId: string, code: string): Promise<boolean> {
  const db = createServiceClient()
  const { data } = await db
    .from('mfa_recovery_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('code_hash', hashCode(code))
    .is('used_at', null)
    .select('id')
    .maybeSingle()
  return !!data
}
