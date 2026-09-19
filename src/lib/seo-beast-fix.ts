// Mechanical auto-fixes for the "SEO & Marketing Beast" scan
// (src/app/api/seo/scan/route.ts) — only for checks that are genuinely safe
// to fix without content judgment: adding a standard tag, a template file,
// or a framework-agnostic inline script. Anything that needs real written
// copy (title, description, OG image, structured data, an actual H1, a
// custom 404 wired into the app's router, a real favicon image) is
// deliberately left for "Fix with AI" instead of being filled with
// placeholder text — that's the "no AI slop" line this scan holds to.

type FileVal = { content?: string } | undefined

function insertBeforeTag(html: string, closeTag: string, snippet: string): string {
  const idx = html.toLowerCase().lastIndexOf(closeTag)
  if (idx === -1) return html + '\n' + snippet
  return html.slice(0, idx) + snippet + '\n' + html.slice(idx)
}

function deriveAltFromSrc(imgTag: string): string {
  const m = imgTag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)
  if (!m) return 'Image'
  const filename = m[1].split('/').pop() || 'image'
  const base = filename.replace(/\.[a-zA-Z0-9]+$/, '').replace(/[-_]+/g, ' ').trim()
  if (!base) return 'Image'
  return base.replace(/\b\w/g, c => c.toUpperCase())
}

function fixImgTags(content: string): string {
  return content.replace(/<img\b[^>]*>/gi, tag => {
    let fixed = tag
    if (!/\balt\s*=/i.test(fixed)) fixed = fixed.replace(/\/?>$/, m => ` alt="${deriveAltFromSrc(tag)}"${m}`)
    if (!/\bloading\s*=/i.test(fixed)) fixed = fixed.replace(/\/?>$/, m => ` loading="lazy"${m}`)
    return fixed
  })
}

export function buildSeoAutoFixes(opts: {
  html: string
  files: Record<string, FileVal>
  baseUrl: string | null
  flags: {
    hasCanonical: boolean
    hasViewport: boolean
    hasLang: boolean
    hasAnalytics: boolean
    hasCookieConsent: boolean
    hasRobots: boolean
    hasSitemap: boolean
    hasLlmsTxt: boolean
    titleText: string | null
    descText: string | null
    totalImgs: number
    missingAlt: number
    lazyImgs: number
  }
}): { fixedFiles: Record<string, string>; fixedCheckIds: string[] } {
  const { files, baseUrl, flags } = opts
  const fixedFiles: Record<string, string> = {}
  const fixedCheckIds: string[] = []
  let html = opts.html

  const origin = baseUrl ? baseUrl.replace(/\/$/, '') : null

  if (!flags.hasViewport) {
    html = insertBeforeTag(html, '</head>', '  <meta name="viewport" content="width=device-width, initial-scale=1" />')
    fixedCheckIds.push('viewport')
  }

  if (!flags.hasCanonical) {
    html = insertBeforeTag(html, '</head>', `  <link rel="canonical" href="${origin ? origin + '/' : '/'}" />`)
    fixedCheckIds.push('canonical')
  }

  if (!flags.hasLang && /<html(\s|>)/i.test(html)) {
    html = html.replace(/<html(\s|>)/i, '<html lang="en"$1')
    fixedCheckIds.push('lang-attr')
  }

  if (!flags.hasAnalytics) {
    html = insertBeforeTag(html, '</body>', ANALYTICS_SNIPPET)
    fixedCheckIds.push('analytics')
  }

  if (!flags.hasCookieConsent) {
    html = insertBeforeTag(html, '</body>', COOKIE_CONSENT_SNIPPET)
    fixedCheckIds.push('cookie-consent')
  }

  // Image fixes run last and operate on `html` (already carrying any
  // head/body insertions above) so index.html only ever gets ONE final
  // write, not two competing ones.
  if (flags.totalImgs > 0 && (flags.missingAlt > 0 || flags.lazyImgs < flags.totalImgs)) {
    if (/<img\b[^>]*>/i.test(html)) html = fixImgTags(html)
    for (const [path, f] of Object.entries(files)) {
      if (path === 'index.html' || !/\.(tsx|jsx)$/.test(path)) continue
      const original = f?.content || ''
      if (!/<img\b[^>]*>/i.test(original)) continue
      const fixed = fixImgTags(original)
      if (fixed !== original) fixedFiles[path] = fixed
    }
    if (flags.missingAlt > 0) fixedCheckIds.push('alt-text')
    if (flags.lazyImgs < flags.totalImgs) fixedCheckIds.push('lazy-loading')
  }

  if (html !== opts.html) fixedFiles['index.html'] = html

  if (!flags.hasRobots) {
    fixedFiles['public/robots.txt'] = `User-agent: *\nAllow: /\n\nSitemap: ${origin ? origin + '/sitemap.xml' : '/sitemap.xml'}\n`
    fixedCheckIds.push('robots')
  }

  if (!flags.hasSitemap && origin) {
    const routes = new Set<string>(['/'])
    const allText = Object.values(files).map(f => f?.content || '').join('\n')
    for (const m of allText.matchAll(/<Route\s[^>]*\bpath\s*=\s*["']([^"':*]+)["']/g)) routes.add(m[1])
    const urls = Array.from(routes).map(r => `  <url><loc>${origin}${r === '/' ? '/' : r}</loc></url>`).join('\n')
    fixedFiles['public/sitemap.xml'] = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
    fixedCheckIds.push('sitemap')
  }

  if (!flags.hasLlmsTxt && flags.titleText && flags.descText) {
    const routes = new Set<string>(['/'])
    const allText = Object.values(files).map(f => f?.content || '').join('\n')
    for (const m of allText.matchAll(/<Route\s[^>]*\bpath\s*=\s*["']([^"':*]+)["']/g)) routes.add(m[1])
    const pages = Array.from(routes).map(r => `- ${origin ? origin + (r === '/' ? '' : r) : r}`).join('\n')
    fixedFiles['public/llms.txt'] = `# ${flags.titleText}\n\n> ${flags.descText}\n\n## Pages\n\n${pages}\n`
    fixedCheckIds.push('llms-txt')
  }

  return { fixedFiles, fixedCheckIds }
}

const ANALYTICS_SNIPPET = `  <script>
    // Analytics scaffold — add a GA4 measurement ID below to start tracking.
    (function () {
      var GA_MEASUREMENT_ID = '';
      if (!GA_MEASUREMENT_ID) return;
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      function gtag() { window.dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', GA_MEASUREMENT_ID);
    })();
  </script>`

const COOKIE_CONSENT_SNIPPET = `  <div id="wyber-cookie-consent" style="display:none;position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#111;color:#fff;padding:16px;font-family:system-ui,sans-serif;font-size:14px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
    <span>This site uses cookies to improve your experience.</span>
    <span>
      <button onclick="document.getElementById('wyber-cookie-consent').style.display='none';localStorage.setItem('cookie-consent','accepted')" style="background:#fff;color:#111;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;margin-right:8px;">Accept</button>
      <button onclick="document.getElementById('wyber-cookie-consent').style.display='none';localStorage.setItem('cookie-consent','declined')" style="background:transparent;color:#fff;border:1px solid #fff;padding:8px 16px;border-radius:6px;cursor:pointer;">Decline</button>
    </span>
  </div>
  <script>
    if (!localStorage.getItem('cookie-consent')) {
      document.addEventListener('DOMContentLoaded', function () {
        var el = document.getElementById('wyber-cookie-consent');
        if (el) el.style.display = 'flex';
      });
    }
  </script>`
