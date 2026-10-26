// AI-search / crawler snapshot of a published app.
//
// Published apps are JavaScript SPAs rendered inside a srcDoc iframe, so a
// crawler that doesn't execute JS — GPTBot, ClaudeBot, PerplexityBot,
// OAI-SearchBot, most AI answer engines — saw ~100 characters (title +
// "Built with WyberAi") and none of the actual content. This renders the app
// once at publish time in headless Chrome, walks the rendered DOM, and keeps a
// clean semantic copy: headings, text, lists, tables, links, image alt text.
// /app/[slug] serves it inside <noscript> (what non-JS clients read; JS users
// see the real app — same content, so not cloaking) and /app/[slug]/llms.txt
// turns it into Markdown.
//
// Safety: the output is rebuilt from an allowlist of tags and attributes —
// no scripts, styles, event handlers, forms or iframes survive, and links are
// limited to http(s)/mailto/tel/#. Treat it as untrusted anyway: it's only
// ever emitted inside <noscript> or as plain text.

const MAX_SNAPSHOT_BYTES = 120_000

export async function renderStaticSnapshot(html: string): Promise<string | null> {
  const chromium = await import('@sparticuz/chromium')
  const puppeteer = await import('puppeteer-core')
  // LOCAL_CHROME_PATH: dev-only override — @sparticuz/chromium ships a Linux
  // (Lambda) binary that can't run on a Windows/macOS dev machine.
  const local = process.env.LOCAL_CHROME_PATH
  const browser = await puppeteer.default.launch({
    args: local ? [] : chromium.default.args,
    defaultViewport: { width: 1280, height: 900 },
    executablePath: local || await chromium.default.executablePath(),
    headless: true,
  })
  try {
    const page = await browser.newPage()
    // Never let the render reach WyberAi's own beacons/APIs (analytics,
    // error alerts, comments) — it would log a fake visit or fake error.
    await page.setRequestInterception(true)
    page.on('request', r => {
      const u = r.url()
      if (/^https?:\/\/(www\.)?wyberai\.com\/api\//.test(u)) r.abort().catch(() => {})
      else r.continue().catch(() => {})
    })
    await page.setContent(html, { waitUntil: 'load', timeout: 20_000 })
    await page.waitForNetworkIdle({ idleTime: 500, timeout: 10_000 }).catch(() => {})
    // Apps render asynchronously after the bundle loads (data seeding,
    // entrance animations), so wait until the visible text stops growing —
    // a fixed short delay captured a half-empty page. Capped at ~8s.
    let last = -1
    for (let i = 0; i < 16; i++) {
      await new Promise(r => setTimeout(r, 500))
      const len = await page.evaluate(() => (document.getElementById('root') || document.body).innerText.length)
      if (len > 0 && len === last && i >= 2) break
      last = len
    }

    const snapshot = await page.evaluate(() => {
      const KEEP = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'UL', 'OL', 'LI', 'A', 'STRONG', 'EM', 'B', 'I', 'BR',
        'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'BLOCKQUOTE', 'ADDRESS', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER',
        'NAV', 'MAIN', 'FIGURE', 'FIGCAPTION', 'DL', 'DT', 'DD', 'IMG', 'TIME'])
      const DROP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'IFRAME', 'CANVAS', 'VIDEO', 'AUDIO', 'TEMPLATE',
        'INPUT', 'SELECT', 'TEXTAREA', 'OPTION', 'BUTTON', 'OBJECT', 'EMBED', 'LINK', 'META'])
      const BLOCK = new Set(['DIV', 'SPAN', 'LABEL'])
      const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      const safeHref = (h: string) => /^(https?:|mailto:|tel:|#)/i.test(h) ? h : ''

      const walk = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) return esc(node.textContent || '')
        if (node.nodeType !== Node.ELEMENT_NODE) return ''
        const el = node as HTMLElement
        const tag = el.tagName
        if (DROP.has(tag)) return ''
        const cs = getComputedStyle(el)
        if (cs.display === 'none' || cs.visibility === 'hidden' || el.getAttribute('aria-hidden') === 'true') return ''
        if (tag === 'IMG') {
          const alt = (el.getAttribute('alt') || '').trim()
          const src = (el as HTMLImageElement).currentSrc || el.getAttribute('src') || ''
          return alt ? `<img alt="${esc(alt)}"${/^https?:/i.test(src) ? ` src="${esc(src)}"` : ''}>` : ''
        }
        const inner = Array.from(el.childNodes).map(walk).join('')
        if (KEEP.has(tag)) {
          const t = tag.toLowerCase()
          if (tag === 'BR') return '<br>'
          if (tag === 'A') {
            const href = safeHref(el.getAttribute('href') || '')
            return inner.trim() ? (href ? `<a href="${esc(href)}">${inner}</a>` : inner) : ''
          }
          if (tag === 'TIME') return inner
          return inner.trim() ? `<${t}>${inner}</${t}>` : ''
        }
        // Unwrap layout wrappers; keep block boundaries readable as text.
        return BLOCK.has(tag) && tag === 'DIV' ? (inner.trim() ? `${inner}\n` : '') : inner
      }

      const root = document.getElementById('root') || document.body
      return walk(root).replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim()
    })

    if (!snapshot || snapshot.replace(/<[^>]+>/g, '').trim().length < 80) return null
    return snapshot.length > MAX_SNAPSHOT_BYTES ? snapshot.slice(0, MAX_SNAPSHOT_BYTES) : snapshot
  } finally {
    await browser.close()
  }
}

/** Plain Markdown version of a snapshot, for llms.txt. */
export function snapshotToMarkdown(snapshot: string): string {
  return snapshot
    .replace(/<h([1-6])>([\s\S]*?)<\/h\1>/gi, (_, n, t) => `\n\n${'#'.repeat(Math.min(Number(n) + 1, 6))} ${t.replace(/<[^>]+>/g, '').trim()}\n\n`)
    .replace(/<li>([\s\S]*?)<\/li>/gi, (_, t) => `\n- ${t.replace(/<[^>]+>/g, ' ').trim()}`)
    .replace(/<a href="([^"]*)">([\s\S]*?)<\/a>/gi, (_, h, t) => `[${t.replace(/<[^>]+>/g, '').trim()}](${h})`)
    .replace(/<img alt="([^"]*)"[^>]*>/gi, (_, a) => `(image: ${a})`)
    .replace(/<\/(p|tr|address|blockquote|section|article|header|footer|dd|figcaption)>/gi, '\n\n')
    .replace(/<br>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
