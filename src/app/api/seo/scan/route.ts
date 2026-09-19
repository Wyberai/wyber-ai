import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { creditCost } from '@/lib/credits'
import { buildSeoAutoFixes } from '@/lib/seo-beast-fix'

// "SEO & Marketing Beast" scan — reads the project's actual generated
// index.html and public/ files and checks for each signal directly, rather
// than guessing from a template. Every check here is something a search
// engine, social platform, AI crawler, or accessibility tool genuinely reads.
// Flat 100-credit charge (see credits.ts), deducted below before the checks
// run — mirrors the pattern in /api/security/beast-scan.

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
      .select('files, subdomain, published_url, custom_domain, custom_domain_verified')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const cost = creditCost('seo-scan')
    const { data: profile } = await admin.from('profiles').select('credits').eq('id', user.id).single()
    if ((profile?.credits ?? 0) < cost) {
      return NextResponse.json({ error: `Not enough credits — this scan costs ${cost} credits.`, gate: 'upgrade', cost }, { status: 402 })
    }
    const { data: deductResult, error: deductErr } = await admin.rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: cost,
    })
    if (deductErr || deductResult === null || deductResult?.new_credits === undefined) {
      return NextResponse.json({ error: 'Could not charge credits for this scan.', gate: 'upgrade', cost }, { status: 402 })
    }
    admin.from('credit_usage').insert({
      user_id: user.id, amount: cost, reason: 'seo-beast-scan',
      credits_before: deductResult.new_credits + cost, credits_after: deductResult.new_credits,
    }).then(() => {}, () => {})

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

    const hasTwitterCard = /name=["']twitter:card["']/i.test(html)
    checks.push({
      id: 'twitter-card',
      label: 'Twitter Card meta tags',
      status: hasTwitterCard ? 'pass' : 'warn',
      detail: hasTwitterCard ? 'twitter:card meta tag found — link previews on X/Twitter will render richly.' : 'No twitter:card meta tag — shared links on X/Twitter fall back to a bare preview.',
    })

    const hasJsonLd = /application\/ld\+json/i.test(html)
    checks.push({
      id: 'structured-data',
      label: 'Structured data (JSON-LD)',
      status: hasJsonLd ? 'pass' : 'warn',
      detail: hasJsonLd ? 'Schema.org JSON-LD found — eligible for rich results in search.' : 'No JSON-LD structured data — optional, but improves how search engines understand the page.',
    })

    const hasCanonical = /rel=["']canonical["']/i.test(html)
    checks.push({
      id: 'canonical',
      label: 'Canonical URL tag',
      status: hasCanonical ? 'pass' : 'warn',
      detail: hasCanonical ? 'A canonical <link> tag is present.' : 'No canonical URL tag — without one, search engines may treat query-string variants of the same page as duplicates.',
    })

    const hasViewport = /name=["']viewport["']/i.test(html)
    checks.push({
      id: 'viewport',
      label: 'Mobile viewport meta tag',
      status: hasViewport ? 'pass' : 'fail',
      detail: hasViewport ? 'Viewport meta tag is present — the page will render correctly on mobile.' : 'No viewport meta tag — mobile browsers will render the page zoomed out, and Google penalizes non-mobile-friendly pages.',
    })

    const hasFaviconTag = /rel=["'](?:icon|shortcut icon)["']/i.test(html)
    const hasFaviconFile = !!files['public/favicon.ico']?.content || !!files['public/favicon.svg']?.content
    checks.push({
      id: 'favicon',
      label: 'Favicon present',
      status: hasFaviconTag || hasFaviconFile ? 'pass' : 'warn',
      detail: hasFaviconTag || hasFaviconFile ? 'A favicon is set — browser tabs and bookmarks will show your brand instead of a blank page.' : 'No favicon found — browser tabs will show a generic blank icon.',
    })

    // Image checks scan every .tsx/.jsx/.html file, not just index.html — a
    // React SPA's real <img> tags mostly live in component files, not the
    // static HTML shell.
    let totalImgs = 0
    let missingAlt = 0
    let lazyImgs = 0
    for (const [path, f] of Object.entries(files)) {
      if (!/\.(tsx|jsx|html)$/.test(path)) continue
      const imgs = Array.from((f?.content || '').matchAll(/<img\b[^>]*>/gi))
      totalImgs += imgs.length
      missingAlt += imgs.filter(m => !/\balt\s*=/i.test(m[0])).length
      lazyImgs += imgs.filter(m => /\bloading\s*=\s*["']lazy["']/i.test(m[0])).length
    }
    checks.push({
      id: 'alt-text',
      label: 'Images have alt text',
      status: totalImgs === 0 ? 'pass' : missingAlt === 0 ? 'pass' : missingAlt === totalImgs ? 'fail' : 'warn',
      detail: totalImgs === 0
        ? 'No <img> tags found to check.'
        : missingAlt === 0
          ? `All ${totalImgs} <img> tag(s) across the app have alt text.`
          : `${missingAlt} of ${totalImgs} <img> tag(s) are missing an alt attribute — screen readers skip them and search engines can't index what they show.`,
    })

    const hasLang = /<html[^>]*\blang\s*=\s*["'][a-z]{2}/i.test(html)
    checks.push({
      id: 'lang-attr',
      label: 'HTML lang attribute set',
      status: hasLang ? 'pass' : 'warn',
      detail: hasLang ? 'The <html> tag declares a language.' : "The <html> tag has no lang attribute — screen readers and search engines can't determine the page language.",
    })

    let hasH1 = /<h1[\s>]/i.test(html)
    if (!hasH1) {
      for (const [path, f] of Object.entries(files)) {
        if (!/\.(tsx|jsx)$/.test(path)) continue
        if (/<h1[\s>]/i.test(f?.content || '')) { hasH1 = true; break }
      }
    }
    checks.push({
      id: 'heading',
      label: 'Page has a proper H1 heading',
      status: hasH1 ? 'pass' : 'warn',
      detail: hasH1 ? 'An <h1> heading was found.' : 'No <h1> found anywhere — a clear top-level heading helps both SEO and accessibility.',
    })

    checks.push({
      id: 'lazy-loading',
      label: 'Images use lazy loading',
      status: totalImgs === 0 ? 'pass' : lazyImgs > 0 ? 'pass' : 'warn',
      detail: totalImgs === 0 ? 'No images to lazy-load.' : lazyImgs > 0 ? `${lazyImgs} of ${totalImgs} image(s) use loading="lazy".` : 'No images use loading="lazy" — every image loads eagerly, which slows down initial page load.',
    })

    const allProjectText = Object.values(files).map(f => f?.content || '').join('\n')

    const hasAnalytics = /(gtag\(|G-[A-Z0-9]{6,}|googletagmanager|GA_MEASUREMENT_ID|plausible\.io|posthog|mixpanel)/i.test(allProjectText)
    checks.push({
      id: 'analytics',
      label: 'Analytics tracking installed',
      status: hasAnalytics ? 'pass' : 'warn',
      detail: hasAnalytics ? 'Analytics tracking code was found.' : 'No analytics tracking (GA4, Plausible, PostHog, etc.) found — you have no visibility into real traffic.',
    })

    const hasCookieConsent = /cookie/i.test(allProjectText) && /(consent|accept.*cookies|cookie.*banner)/i.test(allProjectText)
    checks.push({
      id: 'cookie-consent',
      label: 'Cookie consent banner',
      status: hasCookieConsent ? 'pass' : 'warn',
      detail: hasCookieConsent ? 'Cookie consent handling was found.' : 'No cookie consent banner found — required in most jurisdictions (GDPR/CCPA) if you set any non-essential cookies.',
    })

    const has404 = Object.keys(files).some(p => /not-?found/i.test(p)) || /<Route\s[^>]*path\s*=\s*["']\*["']/i.test(allProjectText)
    checks.push({
      id: 'custom-404',
      label: 'Custom 404 page',
      status: has404 ? 'pass' : 'warn',
      detail: has404 ? 'A custom 404/not-found page was found.' : 'No custom 404 page found — visitors hitting a broken link see a blank or generic error.',
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

    // Real, resolvable base URL only — never a guessed/placeholder domain.
    // custom_domain wins when verified (root-mounted); otherwise fall back to
    // the /app/<subdomain> URL this project actually publishes to
    // (see src/app/api/publish/route.ts). Null until the project has been
    // published at least once, which correctly holds back the sitemap/llms.txt
    // auto-fixes (they need a real absolute URL) while still fixing everything
    // else (tags, robots.txt with a relative sitemap reference, etc.).
    const baseUrl = project.custom_domain_verified && project.custom_domain
      ? `https://${project.custom_domain}`
      : project.published_url || (project.subdomain ? `https://wyberai.com/app/${project.subdomain}` : null)

    const { fixedFiles, fixedCheckIds } = buildSeoAutoFixes({
      html,
      files,
      baseUrl,
      flags: {
        hasCanonical, hasViewport, hasLang, hasAnalytics, hasCookieConsent, hasRobots, hasSitemap, hasLlmsTxt,
        titleText: html.match(/<title>([^<]{4,})<\/title>/i)?.[1] ?? null,
        descText: descMatch?.[1] ?? null,
        totalImgs, missingAlt, lazyImgs,
      },
    })

    return NextResponse.json({ score, checks, scannedAt: new Date().toISOString(), cost, creditsRemaining: deductResult.new_credits, fixedFiles, fixedCheckIds })
  } catch (err) {
    console.error('[seo/scan] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
