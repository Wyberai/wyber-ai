import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sanitizeFiles } from '@/lib/sanitize-files'

// The publish flow runs a full remote build (30–45s) then fetches + stores the
// output. Without this, the serverless function is killed at the platform's
// default timeout mid-build, so the client's "Deploying…" state hangs forever
// and no URL is ever returned. Match the preview-build ceiling.
export const maxDuration = 300

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
    const admin = createServiceClient()

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

    // Strip the in-app storage notice if Supabase is connected
    let files = project.files || {}
    const { data: connector } = await admin
      .from('project_connectors')
      .select('service')
      .eq('project_id', projectId)
      .eq('service', 'supabase')
      .maybeSingle()
    if (connector) {
      const appEntry = Object.entries(files).find(([p]) => p.endsWith('App.tsx') || p.endsWith('App.jsx'))
      if (appEntry) {
        const [path, file] = appEntry as [string, { content?: string }]
        const content = file?.content || ''
        if (content.includes('_storageNotice')) {
          const cleaned = content.replace(
            'const [_storageNotice, _setStorageNotice] = useState(true)',
            'const [_storageNotice, _setStorageNotice] = useState(false)'
          )
          files = { ...files, [path]: { ...file, content: cleaned } }
        }
      }
    }

    // Build the app via Railway
    const buildRes = await fetch(`https://preview-builder.wyberai.com/build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: sanitizeFiles(files), projectId }),
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
    const admin = createServiceClient()

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
