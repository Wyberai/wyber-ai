// Rules for an API key used by an AI agent, in one place so a route cannot forget them.
//   - A key may be "read-only": it can look at projects, files, status and prices, but cannot change, publish, delete,
//     push or invite. Every tool already says whether it only reads (readOnlyHint), so the rule is applied to all of
//     them in one place, and a tool added later is covered too (a tool that does not say it only reads is treated as
//     one that changes things).
//   - A key may expire, and then stops working.
// The columns (scope, expires_at) come from supabase/migrations/20261125010000_api_key_scope_expiry.sql. Before that is
// applied they are simply absent, and every key behaves as it always has: full access, no expiry.

export const READ_ONLY_SCOPE = 'read-only'

export interface KeyRow { active?: boolean | null; scope?: string | null; expires_at?: string | null }

/** Can this key be used right now? Revoked and expired keys cannot. */
export function keyUsable(row: KeyRow | null | undefined, now: Date = new Date()): boolean {
  if (!row || !row.active) return false
  if (row.expires_at && new Date(row.expires_at).getTime() <= now.getTime()) return false
  return true
}

/** The scopes an agent presents with this key. Empty means full access, as before. */
export function scopesFor(row: KeyRow): string[] {
  return row.scope === 'read' ? [READ_ONLY_SCOPE] : []
}

export const KEY_LIMIT = 20
export const EXPIRY_CHOICES = [30, 90, 365] as const

export type KeyOptions = { ok: true; name: string; scope: 'full' | 'read'; expiresAt: string | null } | { ok: false; error: string }

/** Checks what the person asked for when creating a key. Nothing is guessed: bad input is refused. */
export function normalizeKeyOptions(body: unknown, now: Date = new Date()): KeyOptions {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  // eslint-disable-next-line no-control-regex
  const name = String(b.name ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 60) || 'Default'
  const rawScope = b.scope == null || b.scope === '' ? 'full' : b.scope
  if (rawScope !== 'full' && rawScope !== 'read') return { ok: false, error: 'Choose full access or read-only.' }
  const days = b.expiresInDays == null || b.expiresInDays === '' || b.expiresInDays === 0 ? null : Number(b.expiresInDays)
  if (days !== null && !(EXPIRY_CHOICES as readonly number[]).includes(days)) return { ok: false, error: 'Choose 30 days, 90 days, 1 year or no expiry.' }
  return { ok: true, name, scope: rawScope, expiresAt: days === null ? null : new Date(now.getTime() + days * 86_400_000).toISOString() }
}

type ToolFn = (...args: unknown[]) => unknown

/**
 * Wraps `server.tool` so that every tool registered afterwards refuses a read-only key unless the tool only reads.
 * Call it once, before the tools are registered.
 */
export function guardTools(server: { tool: unknown }): void {
  const original = (server.tool as ToolFn).bind(server)
  server.tool = ((...args: unknown[]) => {
    const last = args.length - 1
    const cb = args[last]
    if (typeof cb !== 'function') return original(...args)
    const ann = args[last - 1] as { readOnlyHint?: boolean } | undefined
    const onlyReads = typeof ann === 'object' && ann !== null && ann.readOnlyHint === true
    args[last] = async (...cbArgs: unknown[]) => {
      const extra = cbArgs[cbArgs.length - 1] as { authInfo?: { scopes?: string[] } } | undefined
      if (!onlyReads && extra?.authInfo?.scopes?.includes(READ_ONLY_SCOPE)) {
        return {
          content: [{ type: 'text' as const, text: 'This API key is read-only, so it cannot make changes. Create a full-access key in WyberAi (Settings, API keys) if this agent should build or change things.' }],
          isError: true,
        }
      }
      return (cb as ToolFn)(...cbArgs)
    }
    return original(...args)
  }) as ToolFn
}
