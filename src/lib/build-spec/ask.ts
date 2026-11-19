import { parseJsonObject, withTimeout } from './json'
import type { ModelCall, ModelReply } from './types'

export interface AskOptions {
  call: ModelCall
  system: string
  user: string
  /** Returns the problems with a parsed reply; an empty list means it is good. */
  validate: (value: unknown) => string[]
  /** Total tries, the first plus repairs. Default 2. */
  attempts?: number
  timeoutMs?: number
  /** Called for every model reply, so the caller can add up token use. */
  onUsage?: (reply: ModelReply) => void
}
export type AskResult<T> = { ok: true; value: T } | { ok: false; problems: string[] }

/**
 * The model loop every pillar shares: ask for one JSON object, validate it against the pillar's rules, and on failure ask again
 * with the exact problems and the previous reply. Never throws; a model error, a timeout, bad JSON and a failed check all end as
 * `ok: false` so the caller can fall back instead of breaking a build.
 */
export async function askForJson<T>(o: AskOptions): Promise<AskResult<T>> {
  const attempts = o.attempts ?? 2
  let problems: string[] = []
  let last = ''
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const user = attempt === 0
        ? o.user
        : `${o.user}\n\nYour previous reply had these problems:\n${problems.slice(0, 12).map(p => '- ' + p).join('\n')}\n\nPrevious reply:\n${last}\n\nReturn the complete corrected JSON object only.`
      const call = o.call(o.system, user)
      const reply = await (o.timeoutMs ? withTimeout(call, o.timeoutMs) : call)
      o.onUsage?.(reply)
      last = reply.text
      const value = parseJsonObject(reply.text)
      problems = o.validate(value)
      if (problems.length === 0) return { ok: true, value: value as T }
    } catch (e) {
      problems = [String(e).slice(0, 160)]
    }
  }
  return { ok: false, problems }
}
