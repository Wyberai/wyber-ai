import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain')
  
  if (!domain) return new NextResponse('Not found', { status: 404 })

  try {
    const admin = await createAdminClient()
    
    const { data: project } = await admin
      .from('projects')
      .select('id, name, files')
      .eq('custom_domain', domain)
      .eq('custom_domain_verified', true)
      .eq('is_public', true)
      .single()

    if (!project) return new NextResponse('App not found', { status: 404 })

    // Get built HTML from Supabase Storage
    const { data: fileData } = await admin.storage
      .from('published-apps')
      .download(`${project.id}/index.html`)

    if (!fileData) return new NextResponse('App not built yet', { status: 404 })

    const html = await fileData.text()

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'X-Frame-Options': 'ALLOWALL',
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (err: any) {
    return new NextResponse('Error: ' + err.message, { status: 500 })
  }
}
