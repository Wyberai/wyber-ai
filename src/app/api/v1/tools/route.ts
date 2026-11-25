import { NextRequest, NextResponse } from 'next/server'
import { hit } from '@/lib/agency/limits'
import { credentialFrom, limiterKey, RATE, toolListToHttp } from '@/lib/api-gateway/bridge'
import { callMcp } from '@/lib/api-gateway/call'

export const maxDuration = 60

// GET /api/v1/tools: what an API key can call, with each tool marked read-only or not.
// Auth: the key, as the x-api-key header or a Bearer token. Same keys, same rules as the MCP server (see /api/v1/openapi.json).
export async function GET(req: NextRequest) {
  const cred = credentialFrom(req)
  if (!cred) return NextResponse.json({ ok: false, error: 'Send your API key as the x-api-key header.' }, { status: 401 })
  if (!(await hit(limiterKey(cred), RATE.max, RATE.windowMs))) return NextResponse.json({ ok: false, error: 'Too many requests. Wait a minute and try again.' }, { status: 429, headers: { 'Retry-After': '60' } })
  const { status, rpc } = await callMcp(req, 'tools/list')
  if (status === 401) return NextResponse.json({ ok: false, error: 'That key is not valid. It may have been revoked, expired, or copied with a missing character.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  const out = toolListToHttp(rpc)
  return NextResponse.json(out.body, { status: out.status, headers: { 'Cache-Control': 'no-store' } })
}
