import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/mcp/auth'
import { READ_ONLY_SCOPE } from '@/lib/mcp/guard'

// "Does my key work?" The same check the MCP server runs on every request, answered in plain words, so a person can
// test a key before putting it into an agent. Send it as the x-api-key header (never in the address). It reveals
// nothing about the account: only whether the key is valid and what it may do.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const bearer = /^Bearer\s+/i.test(auth) ? auth.replace(/^Bearer\s+/i, '') : undefined
  const info = await verifyToken(req, bearer)
  if (!info) {
    return NextResponse.json({ ok: false, error: 'That key is not valid. It may have been revoked, it may have expired, or it was copied with a missing character.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }
  const readOnly = (info.scopes ?? []).includes(READ_ONLY_SCOPE)
  return NextResponse.json(
    { ok: true, access: readOnly ? 'read-only' : 'full', message: readOnly ? 'The key works. It can look at your projects but cannot change anything.' : 'The key works. It has full access to your projects.' },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
