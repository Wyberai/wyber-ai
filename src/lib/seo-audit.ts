// Lightweight SEO auditor for the free public tool. Fetches a URL server-side
// and grades the on-page signals that actually move rankings + share previews.
// Regex-based (no cheerio dep). Read-only; never executes page JS.

export type SeoSeverity = 'critical' | 'high' | 'medium' | 'good'

export interface SeoCheck {
  id: string
  label: string
  severity: SeoSeverity
  detail: string
  fix?: string
}

export interface SeoReport {
  url: string
  fetchedAt: string
  score: number // 0-100
  checks: SeoCheck[]
  passed: number
  total: number
}

const WEIGHT: Record<Exclude<SeoSeverity, 'good'>, number> = { critical: 22, high: 12, medium: 6 }

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i'))
  return m ? m[1].trim() : null
}
function metaContent(html: string, key: 'name' | 'property', val: string): string | null {
  const re = new RegExp(`<meta[^>]*\\b${key}\\s*=\\s*["']${val}["'][^>]*>`, 'i')
  const tag = html.match(re)?.[0]
  return tag ? attr(tag, 'content') : null
}

export function analyzeHtml(url: string, html: string, robotsOk: boolean, sitemapOk: boolean): SeoReport {
  const checks: SeoCheck[] = []
  const head = (html.match(/<head[\s\S]*?<\/head>/i)?.[0]) ?? html.slice(0, 20000)

  // Title
  const title = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim()
  if (!title) checks.push({ id: 'title', label: 'Page title', severity: 'critical', detail: 'No <title> tag — this is the single biggest ranking + click signal.', fix: 'Add a unique <title> of 30–60 characters with your primary keyword near the front.' })
  else if (title.length < 15 || title.length > 65) checks.push({ id: 'title', label: 'Page title', severity: 'medium', detail: `Title is ${title.length} chars ("${title.slice(0, 50)}"). Aim for 30–60.`, fix: 'Rewrite to 30–60 characters so Google shows it without truncation.' })
  else checks.push({ id: 'title', label: 'Page title', severity: 'good', detail: `"${title}"` })

  // Meta description
  const desc = metaContent(head, 'name', 'description')
  if (!desc) checks.push({ id: 'desc', label: 'Meta description', severity: 'high', detail: 'No meta description — Google writes its own, usually worse for clicks.', fix: 'Add <meta name="description"> of 120–158 characters that sells the click.' })
  else if (desc.length < 70 || desc.length > 165) checks.push({ id: 'desc', label: 'Meta description', severity: 'medium', detail: `Description is ${desc.length} chars. Aim for 120–158.`, fix: 'Tighten the description to 120–158 characters.' })
  else checks.push({ id: 'desc', label: 'Meta description', severity: 'good', detail: `${desc.length} chars — well sized.` })

  // Open Graph (link previews on WhatsApp/LinkedIn/X — huge in India for shares)
  const ogTitle = metaContent(head, 'property', 'og:title')
  const ogImage = metaContent(head, 'property', 'og:image')
  if (!ogTitle || !ogImage) checks.push({ id: 'og', label: 'Social preview (Open Graph)', severity: 'high', detail: `Missing ${[!ogTitle && 'og:title', !ogImage && 'og:image'].filter(Boolean).join(' + ')}. Links shared on WhatsApp/LinkedIn look bare.`, fix: 'Add og:title, og:description and a 1200×630 og:image so shared links render a rich card.' })
  else checks.push({ id: 'og', label: 'Social preview (Open Graph)', severity: 'good', detail: 'og:title + og:image present — shared links render a card.' })

  // H1
  const h1s = html.match(/<h1[\s>]/gi)?.length ?? 0
  if (h1s === 0) checks.push({ id: 'h1', label: 'H1 heading', severity: 'high', detail: 'No <h1> — search engines use it to understand the page’s topic.', fix: 'Add exactly one <h1> describing the page.' })
  else if (h1s > 1) checks.push({ id: 'h1', label: 'H1 heading', severity: 'medium', detail: `${h1s} <h1> tags found — use exactly one.`, fix: 'Keep a single <h1>; demote the rest to <h2>.' })
  else checks.push({ id: 'h1', label: 'H1 heading', severity: 'good', detail: 'Exactly one <h1>.' })

  // lang
  const lang = html.match(/<html[^>]*\blang\s*=\s*["']([^"']+)["']/i)?.[1]
  if (!lang) checks.push({ id: 'lang', label: 'Language attribute', severity: 'medium', detail: 'No <html lang="…"> — hurts accessibility and regional targeting.', fix: 'Set <html lang="en"> (or your language).' })
  else checks.push({ id: 'lang', label: 'Language attribute', severity: 'good', detail: `lang="${lang}"` })

  // viewport (mobile — most Indian traffic)
  const viewport = metaContent(head, 'name', 'viewport')
  if (!viewport) checks.push({ id: 'viewport', label: 'Mobile viewport', severity: 'high', detail: 'No viewport meta — the page won’t render mobile-friendly, and most of your traffic is mobile.', fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.' })
  else checks.push({ id: 'viewport', label: 'Mobile viewport', severity: 'good', detail: 'Mobile viewport set.' })

  // canonical
  const canonical = /<link[^>]*rel\s*=\s*["']canonical["']/i.test(head)
  if (!canonical) checks.push({ id: 'canonical', label: 'Canonical URL', severity: 'medium', detail: 'No canonical link — risks duplicate-content splitting your ranking.', fix: 'Add <link rel="canonical" href="…"> pointing at the preferred URL.' })
  else checks.push({ id: 'canonical', label: 'Canonical URL', severity: 'good', detail: 'Canonical link present.' })

  // noindex trap
  const robotsMeta = metaContent(head, 'name', 'robots') ?? ''
  if (/noindex/i.test(robotsMeta)) checks.push({ id: 'noindex', label: 'Indexability', severity: 'critical', detail: 'This page has meta robots "noindex" — Google is being told NOT to list it at all.', fix: 'Remove the noindex directive unless you truly want this page hidden.' })
  else checks.push({ id: 'noindex', label: 'Indexability', severity: 'good', detail: 'Page is indexable.' })

  // structured data
  const jsonLd = /<script[^>]*type\s*=\s*["']application\/ld\+json["']/i.test(html)
  if (!jsonLd) checks.push({ id: 'schema', label: 'Structured data', severity: 'medium', detail: 'No JSON-LD structured data — you miss rich results (FAQ, product, org).', fix: 'Add schema.org JSON-LD for your content type.' })
  else checks.push({ id: 'schema', label: 'Structured data', severity: 'good', detail: 'JSON-LD structured data found.' })

  // image alts
  const imgs = html.match(/<img\b[^>]*>/gi) ?? []
  const missingAlt = imgs.filter((t) => !attr(t, 'alt')).length
  if (imgs.length && missingAlt / imgs.length > 0.3) checks.push({ id: 'alt', label: 'Image alt text', severity: 'medium', detail: `${missingAlt} of ${imgs.length} images have no alt text.`, fix: 'Add descriptive alt="" to content images.' })
  else checks.push({ id: 'alt', label: 'Image alt text', severity: 'good', detail: imgs.length ? 'Most images have alt text.' : 'No images to check.' })

  // robots.txt + sitemap
  checks.push(robotsOk
    ? { id: 'robots', label: 'robots.txt', severity: 'good', detail: 'robots.txt found.' }
    : { id: 'robots', label: 'robots.txt', severity: 'medium', detail: 'No robots.txt — crawlers get no guidance.', fix: 'Add /robots.txt with a Sitemap: line.' })
  checks.push(sitemapOk
    ? { id: 'sitemap', label: 'Sitemap', severity: 'good', detail: 'sitemap.xml found.' }
    : { id: 'sitemap', label: 'Sitemap', severity: 'high', detail: 'No sitemap.xml — Google may miss pages, slowing indexing.', fix: 'Generate /sitemap.xml and reference it in robots.txt.' })

  let score = 100
  for (const c of checks) if (c.severity !== 'good') score -= WEIGHT[c.severity]
  const passed = checks.filter((c) => c.severity === 'good').length

  return {
    url,
    fetchedAt: new Date().toISOString(),
    score: Math.max(0, Math.min(100, score)),
    checks: checks.sort((a, b) => rank(b.severity) - rank(a.severity)),
    passed,
    total: checks.length,
  }
}

function rank(s: SeoSeverity): number {
  return s === 'critical' ? 3 : s === 'high' ? 2 : s === 'medium' ? 1 : 0
}
