import { forwardHeaders, parseRpcResponse, rpcBody, type RpcMessage } from './bridge'

/** Sends one JSON-RPC message to the MCP handler in this same process, as the caller. */
export async function callMcp(req: Request, method: 'tools/list' | 'tools/call', params?: unknown): Promise<{ status: number; rpc: RpcMessage | null }> {
  const { POST } = await import('@/app/api/mcp/route')
  const res = await POST(new Request(new URL('/api/mcp', req.url), { method: 'POST', headers: forwardHeaders(req), body: rpcBody(method, params) }))
  const text = await res.text()
  return { status: res.status, rpc: parseRpcResponse(text, res.headers.get('content-type') ?? '') }
}
