import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Composio } from '@composio/core'

// GET /api/composio/connections
// Returns all connected accounts for the current user
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminKey = process.env.COMPOSIO_API_KEY
  if (!adminKey) return NextResponse.json({ connections: [] })

  try {
    const composio = new Composio({ apiKey: adminKey })
    const result = await composio.connectedAccounts.list({ userIds: [user.id] })

    const connections = (result.items ?? []).map((a: {
      id: string
      toolkit: { slug: string }
      status: string
      authConfig: { authScheme: string; isComposioManaged: boolean }
      createdAt: string
    }) => ({
      id: a.id,
      toolkit: a.toolkit?.slug ?? '',
      status: a.status,
      authScheme: a.authConfig?.authScheme ?? '',
      isComposioManaged: a.authConfig?.isComposioManaged ?? true,
      connectedAt: a.createdAt,
    }))

    return NextResponse.json({ connections })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// DELETE /api/composio/connections?accountId=ca_XXX
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accountId = req.nextUrl.searchParams.get('accountId')
  if (!accountId) return NextResponse.json({ error: 'accountId required' }, { status: 400 })

  const adminKey = process.env.COMPOSIO_API_KEY
  if (!adminKey) return NextResponse.json({ error: 'COMPOSIO_API_KEY not configured' }, { status: 503 })

  try {
    const composio = new Composio({ apiKey: adminKey })
    // Verify ownership before deleting
    const account = await composio.connectedAccounts.get(accountId)
    if ((account as { wordId?: string }).wordId !== user.id && (account as { userId?: string }).userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await composio.connectedAccounts.delete(accountId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
