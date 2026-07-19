import { NextRequest, NextResponse } from 'next/server'
import { WorkOS } from '@workos-inc/node'
import { createServiceClient } from '@/lib/supabase/server'

// Sibling to /auth/callback — does not touch existing email/GitHub auth.
// GET /api/auth/sso/login?org=<slug>  →  redirects to the WorkOS authorize URL for that org.
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('org')
  if (!slug) return NextResponse.json({ error: 'org query param required' }, { status: 400 })
  if (!process.env.WORKOS_API_KEY || !process.env.WORKOS_CLIENT_ID) {
    return NextResponse.json({ error: 'SSO is not configured' }, { status: 501 })
  }

  const db = createServiceClient()
  const { data: org } = await db.from('organizations').select('id').eq('slug', slug).maybeSingle()
  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  const { data: connection } = await db
    .from('org_sso_connections')
    .select('workos_org_id, status')
    .eq('org_id', org.id)
    .maybeSingle()

  if (!connection || connection.status !== 'active') {
    return NextResponse.json({ error: 'SSO is not active for this organization' }, { status: 404 })
  }

  const workos = new WorkOS(process.env.WORKOS_API_KEY)
  const authorizationUrl = workos.sso.getAuthorizationUrl({
    clientId: process.env.WORKOS_CLIENT_ID,
    organization: connection.workos_org_id,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyberai.com'}/api/auth/sso/callback`,
  })

  return NextResponse.redirect(authorizationUrl)
}
