import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { hit } from '@/lib/agency/limits'
import { loadActivePortalClient, portalAllowed, requestIp } from '@/lib/agency/portal'
import { clientAccess } from '@/lib/agency/access'

// Counts one view per browser per half hour, so the agency can see whether the client has opened their page. The agency's
// own visits (signed in and able to edit or view that client) are not counted, and nothing is counted while locked.
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!(await hit(`portal-view:${requestIp(req)}:${slug}`, 30, 10 * 60_000))) return new NextResponse(null, { status: 204 })

  const admin = await createAdminClient()
  const client = await loadActivePortalClient(admin, slug)
  if (!client || !portalAllowed(client, req)) return new NextResponse(null, { status: 204 })

  const seenCookie = `wy_cv_${client.id.slice(0, 8)}`
  if (req.cookies.get(seenCookie)) return new NextResponse(null, { status: 204 })

  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (user && (await clientAccess(admin, user.id, client.id))) return new NextResponse(null, { status: 204 })
  } catch { /* signed-out visitors are the normal case */ }

  await admin.from('clients').update({ view_count: (client.view_count ?? 0) + 1, last_viewed_at: new Date().toISOString() }).eq('id', client.id)

  const res = new NextResponse(null, { status: 204 })
  res.cookies.set(seenCookie, '1', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 30 })
  return res
}
