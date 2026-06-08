import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await createAdminClient()
    const { data: app, error } = await admin
      .from('prebuilt_apps')
      .select('id, name, description, category, keywords, preview_color')
      .eq('id', params.id)
      .single()

    if (error || !app) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ app })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
