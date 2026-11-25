// A plain REST door onto the same tools the MCP server offers, for everything that cannot speak MCP: ChatGPT custom
// actions, n8n, Zapier, Make, a script, curl. It adds no logic of its own. Each request is handed to the MCP handler
// in the same process, with the same key, so the key check, the read-only rule, credits and every tool's own rules
// apply exactly as they do for Claude or Cursor, and there is no second copy of anything to keep in step.

import { createHash } from 'crypto'

export const RATE = { max: 120, windowMs: 60_000 } // calls per key per minute
export const MAX_BODY = 200_000                    // characters

export interface RpcMessage { result?: any; error?: { code: number; message: string } } // eslint-disable-line @typescript-eslint/no-explicit-any

/** The key an agent sent: the x-api-key header, or a Bearer token. Trimmed; empty when there is none. */
export function credentialFrom(req: Request): string {
  const auth = req.headers.get('authorization') ?? ''
  const bearer = /^Bearer\s+/i.test(auth) ? auth.replace(/^Bearer\s+/i, '') : ''
  return (req.headers.get('x-api-key') || bearer || '').trim()
}

/** A stable label for rate limiting that never contains the key itself. */
export const limiterKey = (credential: string): string => `api-v1:${createHash('sha256').update(credential).digest('hex').slice(0, 24)}`

export const rpcBody = (method: 'tools/list' | 'tools/call', params?: unknown): string => JSON.stringify({ jsonrpc: '2.0', id: 1, method, ...(params === undefined ? {} : { params }) })

/** Headers for the in-process call: the caller's credentials, and the two content types MCP over HTTP requires. */
export function forwardHeaders(req: Request): Headers {
  const h = new Headers({ 'content-type': 'application/json', accept: 'application/json, text/event-stream' })
  const auth = req.headers.get('authorization')
  const key = req.headers.get('x-api-key')
  if (auth) h.set('authorization', auth)
  if (key) h.set('x-api-key', key)
  return h
}

/** The MCP handler answers with plain JSON or with a one-message event stream; read either. */
export function parseRpcResponse(text: string, contentType: string): RpcMessage | null {
  try {
    if (/text\/event-stream/i.test(contentType) || /^\s*(event|data):/m.test(text)) {
      let last: RpcMessage | null = null
      for (const line of text.split(/\r?\n/)) {
        if (line.startsWith('data:')) { try { const m = JSON.parse(line.slice(5).trim()); if (m && (m.result !== undefined || m.error)) last = m } catch { /* a keep-alive or partial line */ } }
      }
      return last
    }
    const m = JSON.parse(text)
    return m && (m.result !== undefined || m.error) ? m : null
  } catch { return null }
}

type Http = { status: number; body: Record<string, unknown> }

/** What a tool call answered, as an HTTP answer a script can act on. */
export function toolCallToHttp(rpc: RpcMessage | null, name: string): Http {
  if (!rpc) return { status: 502, body: { ok: false, error: 'The tool server did not answer. Try again.' } }
  if (rpc.error) {
    const missing = /not found|unknown tool|-32602/i.test(`${rpc.error.message} ${rpc.error.code}`)
    return missing
      ? { status: 404, body: { ok: false, error: `There is no tool called "${name}". GET /api/v1/tools lists them.` } }
      : { status: 400, body: { ok: false, error: rpc.error.message } }
  }
  const text: string = (rpc.result?.content ?? []).map((c: { text?: string }) => c.text ?? '').join('\n')
  if (rpc.result?.isError) return { status: /read-only/i.test(text) ? 403 : 400, body: { ok: false, error: text } }
  try { return { status: 200, body: { ok: true, result: JSON.parse(text) } } } catch { return { status: 200, body: { ok: true, result: { text } } } }
}

/** The tool list, with each tool marked read-only or not, so a script can tell which ones a read-only key may call. */
export function toolListToHttp(rpc: RpcMessage | null): Http {
  if (!rpc || rpc.error) return { status: 502, body: { ok: false, error: 'The tool server did not answer. Try again.' } }
  const tools = ((rpc.result?.tools ?? []) as Array<{ name: string; description?: string; inputSchema?: unknown; annotations?: { readOnlyHint?: boolean } }>)
    .map(t => ({ name: t.name, description: t.description ?? '', readOnly: t.annotations?.readOnlyHint === true, inputSchema: t.inputSchema ?? { type: 'object' } }))
  return { status: 200, body: { ok: true, count: tools.length, tools } }
}

/** Reads the JSON object a caller sent as the tool's arguments. An empty body means no arguments. */
export async function readArguments(req: Request): Promise<{ ok: true; args: Record<string, unknown> } | { ok: false; error: string }> {
  const text = await req.text()
  if (text.length > MAX_BODY) return { ok: false, error: 'That request is too large.' }
  if (!text.trim()) return { ok: true, args: {} }
  try {
    const v = JSON.parse(text)
    if (v === null || typeof v !== 'object' || Array.isArray(v)) return { ok: false, error: 'Send a JSON object with the tool\'s arguments, like {"project_id": "..."}.' }
    return { ok: true, args: v as Record<string, unknown> }
  } catch { return { ok: false, error: 'The request body is not valid JSON.' } }
}

export const validToolName = (name: string): boolean => /^[a-z][a-z0-9_]{0,63}$/.test(name)
