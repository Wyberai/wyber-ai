import { NextRequest, NextResponse } from 'next/server'
import { sanitizeFiles } from '@/lib/sanitize-files'
import { createClient } from '@/lib/supabase/server'
import { isInternalRequest } from '@/lib/internal-auth'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user && !isInternalRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    // Sanitize server-side so EVERY client (esp. the mobile app, which posts raw
    // generated files) gets the same guaranteed entry/config/tailwind + stubbed
    // imports the desktop editor adds before building. Without this, a real
    // multi-file project has no entry point and the preview build never renders.
    const files = body?.files && typeof body.files === 'object' ? sanitizeFiles(body.files) : body?.files
    const res = await fetch('https://preview-builder.wyberai.com/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, files }),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
