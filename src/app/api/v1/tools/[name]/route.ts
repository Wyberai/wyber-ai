import { NextRequest, NextResponse } from 'next/server'
import { hit } from '@/lib/agency/limits'
import { credentialFrom, limiterKey, RATE, readArguments, toolCallToHttp, validToolName } from '@/lib/api-gateway/bridge'
import { callMcp } from '@/lib/api-gateway/call'

export const maxDuration = 60

// POST /api/v1/tools/{name}  with the tool's arguments as a JSON object: runs that tool as the key's owner.
// A read-only key can call only the tools GET /api/v1/tools marks readOnly; anything else answers 403.
export async function POST(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const noStore = { 'Cache-Control': 'no-store' }
  const cred = credentialFrom(req)
  if (!cred) return NextResponse.json({ ok: false, error: 'Send your API key as the x-api-key header.' }, { status: 401 })
  if (!validToolName(name)) return NextResponse.json({ ok: false, error: `There is no tool called "${name}". GET /api/v1/tools lists them.` }, { status: 404 })
  const args = await readArguments(req)
  if (!args.ok) return NextResponse.json({ ok: false, error: args.error }, { status: 400 })
  if (!(await hit(limiterKey(cred), RATE.max, RATE.windowMs))) return NextResponse.json({ ok: false, error: 'Too many requests. Wait a minute and try again.' }, { status: 429, headers: { ...noStore, 'Retry-After': '60' } })
  const { status, rpc } = await callMcp(req, 'tools/call', { name, arguments: args.args })
  if (status === 401) return NextResponse.json({ ok: false, error: 'That key is not valid. It may have been revoked, expired, or copied with a missing character.' }, { status: 401, headers: noStore })
  const out = toolCallToHttp(rpc, name)
  return NextResponse.json(out.body, { status: out.status, headers: noStore })
}
