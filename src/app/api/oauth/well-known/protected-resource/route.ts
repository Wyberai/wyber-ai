import { NextRequest, NextResponse } from 'next/server'

// RFC 9728 Protected Resource Metadata. Served at
// /.well-known/oauth-protected-resource via a rewrite in next.config.js — this
// is the URL the MCP server's 401 WWW-Authenticate header points Claude to.
// `resource` MUST equal the MCP server URL exactly as the user enters it.
export async function GET(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin
  return NextResponse.json(
    {
      resource: `${base}/api/mcp`,
      authorization_servers: [base],
      scopes_supported: ['mcp'],
      bearer_methods_supported: ['header'],
    },
    { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' } },
  )
}

export function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  })
}
