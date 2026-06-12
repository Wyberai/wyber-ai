import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await createAdminClient()
    const { data } = await admin
      .from('projects')
      .select('canvas_data')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    const storeListing = (data?.canvas_data as any)?.store_listing ?? null
    return NextResponse.json({ store_listing: storeListing })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { store_listing } = await req.json()
    const admin = await createAdminClient()

    // Read existing canvas_data so we don't overwrite agent/workflow canvas state
    const { data: existing } = await admin
      .from('projects')
      .select('canvas_data')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    const merged = { ...(existing?.canvas_data as object ?? {}), store_listing }

    await admin
      .from('projects')
      .update({ canvas_data: merged, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
