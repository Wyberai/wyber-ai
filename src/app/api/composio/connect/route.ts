import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Composio } from '@composio/core'

// Cache of authConfigId per toolkit slug (no need to recreate each time)
const authConfigCache = new Map<string, string>()

// GET /api/composio/connect?toolkit=GMAIL
// Returns { redirectUrl, connectionId } for the OAuth popup
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const toolkit = req.nextUrl.searchParams.get('toolkit')?.toLowerCase()
  if (!toolkit) return NextResponse.json({ error: 'toolkit param required' }, { status: 400 })

  const adminKey = process.env.COMPOSIO_API_KEY
  if (!adminKey) return NextResponse.json({ error: 'COMPOSIO_API_KEY not configured' }, { status: 503 })

  const composio = new Composio({ apiKey: adminKey })

  try {
    // Get or create Composio-managed auth config for this toolkit
    let authConfigId = authConfigCache.get(toolkit)

    if (!authConfigId) {
      const existing = await composio.authConfigs.list({ toolkit })
      authConfigId = existing.items?.[0]?.id

      if (!authConfigId) {
        const created = await composio.authConfigs.create(toolkit, {
          type: 'use_composio_managed_auth',
          name: `${toolkit} (Composio managed)`,
        })
        authConfigId = created.id
      }

      authConfigCache.set(toolkit, authConfigId!)
    }

    // Build callback URL — include connectionId after the fact via connectionId query param
    // Composio will append ?status=success|failed to our callbackUrl
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wyberai.vercel.app'
    const callbackUrl = `${appUrl}/api/composio/callback`

    const connectionRequest = await composio.connectedAccounts.link(
      user.id,
      authConfigId!,
      { callbackUrl }
    )

    return NextResponse.json({
      redirectUrl: connectionRequest.redirectUrl,
      connectionId: connectionRequest.id,
      toolkit,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
