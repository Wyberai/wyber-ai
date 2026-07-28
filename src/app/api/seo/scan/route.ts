import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Real SEO & AI-search diagnostic — reads the project's actual generated
// index.html and public/ files and checks for each signal directly, rather
// than guessing from a template. Every check here is something a search
// engine, social platform, or AI crawler genuinely reads.

interface Check { id: string; label: string; status: 'pass' | 'warn' | 'fail'; detail: string }

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId } = await req.json()
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

    const admin = await createAdminClient()
    const { data: project, error } = await admin
      .from('projects')
      .select('files')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const files: Record<string, { content?: string }> = project.files || {}
    const html = files['index.html']?.content || ''
    const checks: Check[] = []

    const hasTitle = /<title>([^<]{4,})<\/title>/i.test(html)
    checks.push({
      id: 'title',
      label: 'Page title is set',
      status: hasTitle ? 'pass' : 'fail',
      detail: hasTitle ? 'A descriptive <title> is present.' : 'No <title> tag found — search engines and browser tabs will show a generic/blank title.',
    })

    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)
    const hasDesc = !!descMatch && descMatch[1].length > 20
    checks.push({
      id: 'description',
      label: 'Meta description is set',
      status: hasDesc ? 'pass' : 'fail',
      detail: hasDesc ? 'A meta description is present and non-trivial.' : 'No meaningful <meta name="description"> — this is the snippet shown under your link in search results.',
    })

    const hasOgTitle = /property=["']og:title["']/i.test(html)
    const hasOgImage = /property=["']og:image["']/i.test(html)
    checks.push({
      id: 'opengraph',
      label: 'Social preview tags (Open Graph)',
      status: hasOgTitle && hasOgImage ? 'pass' : hasOgTitle || hasOgImage ? 'warn' : 'fail',
      detail: hasOgTitle && hasOgImage
        ? 'og:title and og:image are both present — links will render with a rich preview on social/chat apps.'
        : 'Missing og:title and/or og:image — shared links will show a bare URL instead of a rich preview.',
    })

    const hasJsonLd = /application\/ld\+json/i.test(html)
    checks.push({
      id: 'structured-data',
      label: 'Structured data (JSON-LD)',
      status: hasJsonLd ? 'pass' : 'warn',
      detail: hasJsonLd ? 'Schema.org JSON-LD found — eligible for rich results in search.' : 'No JSON-LD structured data — optional, but improves how search engines understand the page.',
    })

    const hasRobots = !!files['public/robots.txt']?.content
    checks.push({
      id: 'robots',
      label: 'robots.txt present',
      status: hasRobots ? 'pass' : 'fail',
      detail: hasRobots ? 'robots.txt exists and points crawlers to your sitemap.' : 'No robots.txt — crawlers have no explicit guidance and may miss your sitemap link.',
    })

    const hasSitemap = !!files['public/sitemap.xml']?.content
    checks.push({
      id: 'sitemap',
      label: 'sitemap.xml present',
      status: hasSitemap ? 'pass' : 'fail',
      detail: hasSitemap ? 'sitemap.xml exists, listing your pages for crawlers.' : 'No sitemap.xml — search engines have to discover pages by following links alone.',
    })

    const hasLlmsTxt = !!files['public/llms.txt']?.content
    checks.push({
      id: 'llms-txt',
      label: 'AI assistants can read your site (llms.txt)',
      status: hasLlmsTxt ? 'pass' : 'warn',
      detail: hasLlmsTxt
        ? 'llms.txt exists — AI assistants (ChatGPT, Claude, Perplexity) get a clean, structured summary of your site instead of having to scrape rendered HTML.'
        : 'No llms.txt — AI assistants and answer engines have no dedicated, structured entry point into your content. This is the newest SEO surface: optimizing for being cited by AI, not just ranked by Google.',
    })

    const passCount = checks.filter(c => c.status === 'pass').length
    const score = Math.round((passCount / checks.length) * 100)

    return NextResponse.json({ score, checks, scannedAt: new Date().toISOString() })
  } catch (err) {
    console.error('[seo/scan] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
