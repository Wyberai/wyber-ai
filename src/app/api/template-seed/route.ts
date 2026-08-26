import { NextRequest, NextResponse } from 'next/server'
import { getTemplateSeed } from '@/lib/template-reference'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { prompt, projectType } = await req.json()
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(null)
    }
    // Only pre-load seeds for web/SaaS — mobile templates differ significantly
    if (projectType === 'mobile') return NextResponse.json(null)

    // Auth check — same gate as /api/generate
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json(null, { status: 401 })

    const seed = await getTemplateSeed(prompt)
    return NextResponse.json(seed)
  } catch {
    return NextResponse.json(null)
  }
}
