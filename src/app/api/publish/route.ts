import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

async function ensureUniqueSlug(base: string, admin: any): Promise<string> {
  let slug = base
  let attempt = 0
  while (true) {
    const { data } = await admin.from('projects').select('id').eq('subdomain', slug).maybeSingle()
    if (!data) return slug
    attempt++
    slug = `${base}-${attempt}`
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId } = await req.json()
    const admin = await createAdminClient()

    const { data: project } = await admin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    // Generate clean slug
    let subdomain = project.subdomain
    if (!subdomain) {
      const base = slugify(project.name || `app-${projectId.slice(0, 8)}`)
      subdomain = await ensureUniqueSlug(base, admin)
    }

    // Build the app via Railway proxy
    const buildRes = await fetch(`${process.env.NEXTAUTH_URL || 'https://wyberai.com'}/api/preview-build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: project.files, projectId }),
    })

    const buildData = await buildRes.json()

    if (!buildData.url) {
      return NextResponse.json({ error: 'Build failed: ' + (buildData.error || 'Unknown') }, { status: 500 })
    }

    // Fetch the built HTML from Railway
    const htmlRes = await fetch(buildData.url)
    const html = await htmlRes.text()

    // Fix asset paths to be absolute (pointing to Railway CDN)
    const baseUrl = buildData.url.replace('/index.html', '')
    const fixedHtml = html
      .replace(/src="\.\/assets\//g, `src="${baseUrl}/assets/`)
      .replace(/href="\.\/assets\//g, `href="${baseUrl}/assets/`)
      .replace(/from "\.\/assets\//g, `from "${baseUrl}/assets/`)

    // Store in Supabase Storage
    const { error: uploadError } = await admin.storage
      .from('published-apps')
      .upload(`${projectId}/index.html`, fixedHtml, {
        contentType: 'text/html',
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to store app' }, { status: 500 })
    }

    const publishedUrl = `https://wyberai.com/app/${subdomain}`

    // Update project
    await admin
      .from('projects')
      .update({
        subdomain,
        published_url: publishedUrl,
        is_public: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)

    return NextResponse.json({ subdomain, publishedUrl })
  } catch (err: any) {
    console.error('Publish error:', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId } = await req.json()
    const admin = await createAdminClient()

    await admin.storage.from('published-apps').remove([`${projectId}/index.html`])
    await admin.from('projects')
      .update({ published_url: null, is_public: false })
      .eq('id', projectId)
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
