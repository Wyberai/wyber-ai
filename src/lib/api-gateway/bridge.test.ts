import { describe, expect, it } from 'vitest'
import { credentialFrom, forwardHeaders, limiterKey, parseRpcResponse, readArguments, toolCallToHttp, toolListToHttp, validToolName } from './bridge'

const req = (headers: Record<string, string>, body?: string) => new Request('https://x.test/api/v1/tools/list_projects', { method: 'POST', headers, body })

describe('which key was sent', () => {
  it('reads x-api-key or a Bearer token, trimmed, and nothing else', () => {
    expect(credentialFrom(req({ 'x-api-key': '  wyb_abc ' }))).toBe('wyb_abc')
    expect(credentialFrom(req({ authorization: 'Bearer wyb_def' }))).toBe('wyb_def')
    expect(credentialFrom(req({ authorization: 'Basic abc' }))).toBe('')
    expect(credentialFrom(req({}))).toBe('')
  })
  it('the limiter label never contains the key', () => {
    const k = limiterKey('wyb_super_secret_key_value')
    expect(k).not.toContain('super_secret')
    expect(k.startsWith('api-v1:')).toBe(true)
    expect(limiterKey('a')).not.toBe(limiterKey('b'))
  })
  it('forwards only the credentials, plus the content types MCP over HTTP requires', () => {
    const h = forwardHeaders(req({ 'x-api-key': 'k', cookie: 'session=abc', origin: 'https://evil.test' }))
    expect(h.get('x-api-key')).toBe('k')
    expect(h.get('accept')).toContain('text/event-stream')
    expect(h.get('cookie')).toBeNull()
    expect(h.get('origin')).toBeNull()
  })
})

describe('reading the answer from the tool server', () => {
  const msg = { jsonrpc: '2.0', id: 1, result: { content: [{ type: 'text', text: '{"projects":[]}' }] } }
  it('reads plain JSON and a one-message event stream the same way', () => {
    expect(parseRpcResponse(JSON.stringify(msg), 'application/json')?.result).toEqual(msg.result)
    expect(parseRpcResponse(`event: message\ndata: ${JSON.stringify(msg)}\n\n`, 'text/event-stream')?.result).toEqual(msg.result)
    expect(parseRpcResponse(`: keep-alive\n\ndata: ${JSON.stringify(msg)}\n\n`, 'text/event-stream')?.result).toEqual(msg.result)
  })
  it('gives nothing, rather than guessing, for anything unreadable', () => {
    expect(parseRpcResponse('<html>502</html>', 'text/html')).toBeNull()
    expect(parseRpcResponse('', 'application/json')).toBeNull()
    expect(parseRpcResponse('data: not json\n\n', 'text/event-stream')).toBeNull()
  })
})

describe('a tool call as an HTTP answer', () => {
  const ok = (text: string) => ({ result: { content: [{ type: 'text', text }] } })
  it('200 with the parsed result, or the text when the tool answered in prose', () => {
    expect(toolCallToHttp(ok('{"count":2}'), 'x')).toEqual({ status: 200, body: { ok: true, result: { count: 2 } } })
    expect(toolCallToHttp(ok('Done.'), 'x')).toEqual({ status: 200, body: { ok: true, result: { text: 'Done.' } } })
  })
  it('403 when a read-only key is refused, 400 for any other tool error', () => {
    const readOnly = toolCallToHttp({ result: { isError: true, content: [{ type: 'text', text: 'This API key is read-only, so it cannot make changes.' }] } }, 'delete_project')
    expect(readOnly.status).toBe(403)
    expect(toolCallToHttp({ result: { isError: true, content: [{ type: 'text', text: 'You need 30 credits' }] } }, 'start_build').status).toBe(400)
  })
  it('404 for a tool that does not exist, 502 when there was no answer at all', () => {
    expect(toolCallToHttp({ error: { code: -32602, message: 'Tool nope not found' } }, 'nope').status).toBe(404)
    expect(toolCallToHttp(null, 'x').status).toBe(502)
  })
})

describe('the tool list', () => {
  it('marks each tool read-only or not, so a script knows what a read-only key may call', () => {
    const out = toolListToHttp({ result: { tools: [
      { name: 'list_projects', description: 'List', inputSchema: { type: 'object' }, annotations: { readOnlyHint: true } },
      { name: 'delete_project', description: 'Delete', annotations: { readOnlyHint: false } },
      { name: 'unmarked', description: 'x' },
    ] } })
    expect(out.status).toBe(200)
    const tools = out.body.tools as Array<{ name: string; readOnly: boolean }>
    expect(tools.map(t => [t.name, t.readOnly])).toEqual([['list_projects', true], ['delete_project', false], ['unmarked', false]])
    expect(out.body.count).toBe(3)
  })
})

describe('reading the arguments a caller sent', () => {
  it('an empty body means no arguments; an object is passed on', async () => {
    expect(await readArguments(req({}, ''))).toEqual({ ok: true, args: {} })
    expect(await readArguments(req({}, '{"project_id":"p1"}'))).toEqual({ ok: true, args: { project_id: 'p1' } })
  })
  it('refuses anything else with a plain message: not JSON, not an object, too large', async () => {
    expect((await readArguments(req({}, 'oops'))).ok).toBe(false)
    expect((await readArguments(req({}, '[1,2]'))).ok).toBe(false)
    expect((await readArguments(req({}, '"text"'))).ok).toBe(false)
    expect((await readArguments(req({}, JSON.stringify({ a: 'x'.repeat(250_000) })))).ok).toBe(false)
  })
  it('only plain tool names are accepted, so nothing odd is forwarded', () => {
    for (const n of ['list_projects', 'get_project', 'x1']) expect(validToolName(n)).toBe(true)
    for (const n of ['', 'List', '../mcp', 'a b', 'a;b', 'x'.repeat(70), '1abc']) expect(validToolName(n)).toBe(false)
  })
})
