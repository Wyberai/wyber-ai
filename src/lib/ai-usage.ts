import Anthropic from '@anthropic-ai/sdk'

/**
 * One place that records the real token usage and cost of EVERY Anthropic call the app makes.
 *
 * Why: src/app/api/generate/route.ts logs the build it runs into generation_usage_log, but about 45 other routes and
 * helpers (project naming, intent checks, suggestions, chat, assist, the scheduled ops agents, the watchdog's key test)
 * also spend money and were invisible. A measured $0.16 of Sonnet spend on one day appeared on the Anthropic Console and
 * nowhere in the app's own log, which is what prompted this.
 *
 * How: createAnthropic() returns the normal SDK client with a wrapped `fetch`. The wrapper hands the response to the SDK
 * untouched and reads a CLONE in the background (JSON body, or the SSE stream's message_start and message_delta events)
 * to get the usage, then inserts one row. Nothing here can change or delay a response: failures are swallowed.
 *
 * Rows go into generation_usage_log (service-role only, no migration needed) with action_type "call:<label>",
 * stage "call", build_id null, credits_charged 0, so they are separate from build rows and the build overage check
 * (which sums by build_id) never sees them. generate/route.ts and claude-parallel keep their own logging and do not use
 * this wrapper, so nothing is counted twice.
 */

// $/MTok, from Anthropic's pricing page (checked 2026-11-09). Cache reads on Sonnet 5.5 are 0.05x the input price.
interface Rates { input: number; output: number; cacheWrite: number; cacheRead: number }
const SONNET_5_5: Rates = { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.1 }
const HAIKU_5_5_SMALL: Rates = { input: 0.1, output: 0.5, cacheWrite: 0.125, cacheRead: 0.01 } // prompts up to 100k tokens
const HAIKU_5_5_LARGE: Rates = { input: 0.5, output: 2.5, cacheWrite: 0.625, cacheRead: 0.05 } // prompts over 100k tokens

export interface Usage { input: number; output: number; cacheWrite: number; cacheRead: number }

/** Cost in USD for one call, or null for a model whose price this table does not know (never guessed). */
export function costUsd(model: string, u: Usage): number | null {
  let r: Rates | null = null
  if (/sonnet-5-5/.test(model)) r = SONNET_5_5
  else if (/haiku-5-5/.test(model)) r = u.input + u.cacheWrite + u.cacheRead > 100_000 ? HAIKU_5_5_LARGE : HAIKU_5_5_SMALL
  if (!r) return null
  const v = (u.input * r.input + u.output * r.output + u.cacheWrite * r.cacheWrite + u.cacheRead * r.cacheRead) / 1_000_000
  return Number(v.toFixed(5))
}

interface RawUsage { input_tokens?: number; output_tokens?: number; cache_creation_input_tokens?: number; cache_read_input_tokens?: number }
const fromRaw = (r: RawUsage | undefined): Usage => ({
  input: r?.input_tokens ?? 0, output: r?.output_tokens ?? 0,
  cacheWrite: r?.cache_creation_input_tokens ?? 0, cacheRead: r?.cache_read_input_tokens ?? 0,
})

/** Pull usage and model out of a complete (non-streaming) /v1/messages JSON body. */
export function parseMessageJson(body: unknown): { model: string; usage: Usage } | null {
  const b = body as { model?: string; usage?: RawUsage } | null
  if (!b || !b.usage) return null
  return { model: b.model ?? 'unknown', usage: fromRaw(b.usage) }
}

/** Incremental SSE reader: feed it text chunks, read the result at the end. */
export class SseUsage {
  private buf = ''
  private model = 'unknown'
  private usage: Usage = { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 }
  private seen = false
  push(chunk: string): void {
    this.buf += chunk
    let i: number
    while ((i = this.buf.indexOf('\n')) >= 0) {
      const line = this.buf.slice(0, i).replace(/\r$/, '')
      this.buf = this.buf.slice(i + 1)
      if (!line.startsWith('data:')) continue
      const json = line.slice(5).trim()
      if (!json || json === '[DONE]') continue
      try {
        const ev = JSON.parse(json) as { type?: string; message?: { model?: string; usage?: RawUsage }; usage?: RawUsage }
        if (ev.type === 'message_start' && ev.message) {
          this.model = ev.message.model ?? this.model
          this.usage = fromRaw(ev.message.usage)
          this.seen = true
        } else if (ev.type === 'message_delta' && ev.usage) {
          // output_tokens here is the running total for the message; the other fields are only present when they changed.
          const d = ev.usage
          if (d.output_tokens !== undefined) this.usage.output = d.output_tokens
          if (d.input_tokens !== undefined) this.usage.input = d.input_tokens
          if (d.cache_creation_input_tokens !== undefined) this.usage.cacheWrite = d.cache_creation_input_tokens
          if (d.cache_read_input_tokens !== undefined) this.usage.cacheRead = d.cache_read_input_tokens
          this.seen = true
        }
      } catch { /* a partial or non-JSON data line: ignore */ }
    }
  }
  result(): { model: string; usage: Usage } | null { return this.seen ? { model: this.model, usage: this.usage } : null }
}

async function record(label: string, model: string, u: Usage): Promise<void> {
  if (process.env.NODE_ENV === 'test') return
  if (!(u.input || u.output || u.cacheWrite || u.cacheRead)) return
  try {
    const { createServiceClient } = await import('@/lib/supabase/server')
    const admin = createServiceClient()
    await admin.from('generation_usage_log').insert({
      action_type: `call:${label}`.slice(0, 120),
      stage: 'call',
      model_tier: /haiku/.test(model) ? 'cheap' : /sonnet/.test(model) ? 'fast' : 'other',
      model_id: model,
      input_tokens: u.input,
      output_tokens: u.output,
      cache_creation_input_tokens: u.cacheWrite,
      cache_read_input_tokens: u.cacheRead,
      cost_usd: costUsd(model, u),
      credits_charged: 0,
    })
  } catch { /* logging must never affect the request */ }
}

/** Run a background task to completion even after the response is sent (serverless), falling back to fire-and-forget. */
async function keepAlive(task: Promise<void>): Promise<void> {
  try {
    const { after } = await import('next/server')
    after(task)
  } catch { void task.catch(() => {}) }
}

function observe(label: string, res: Response): void {
  if (!res.ok) return
  let clone: Response
  try { clone = res.clone() } catch { return }
  const ct = clone.headers.get('content-type') || ''
  const task = (async () => {
    try {
      if (ct.includes('text/event-stream') && clone.body) {
        const sse = new SseUsage()
        const reader = clone.body.getReader()
        const dec = new TextDecoder()
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          sse.push(dec.decode(value, { stream: true }))
        }
        const r = sse.result()
        if (r) await record(label, r.model, r.usage)
      } else if (ct.includes('json')) {
        const r = parseMessageJson(await clone.json())
        if (r) await record(label, r.model, r.usage)
      }
    } catch { /* never throw into the caller */ }
  })()
  void keepAlive(task)
}

const isMessages = (input: RequestInfo | URL): boolean => {
  const s = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url
  return s.includes('/v1/messages') && !s.includes('/count_tokens') && !s.includes('/batches')
}

/** fetch that records usage for /v1/messages calls, for the 4 files that call the API without the SDK. */
export async function loggedFetch(label: string, input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init)
  if (isMessages(input)) observe(label, res)
  return res
}

type ClientOptions = ConstructorParameters<typeof Anthropic>[0]

/** The normal SDK client, with usage logging. `label` says who called (for example "api/assist"). */
export function createAnthropic(label: string, opts?: ClientOptions): Anthropic {
  const inner = (opts?.fetch ?? globalThis.fetch) as typeof fetch
  const wrapped = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const res = await inner(input, init)
    if (isMessages(input)) observe(label, res)
    return res
  }) as typeof fetch
  return new Anthropic({ ...(opts ?? {}), fetch: wrapped })
}
