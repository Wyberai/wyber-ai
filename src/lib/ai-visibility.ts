// AI visibility check: can the assistants that answer people's questions (ChatGPT search, Claude, Perplexity, Google's AI
// answers) actually read this site? Most of them do not run JavaScript, so a site built as a JavaScript app can look empty
// to them. This grades what a non-JS reader receives. It is deterministic: no model is called and nothing is guessed.
// The fetching is done by the caller (so it can be tested); this file only reads what came back.

export interface Fetched { ok: boolean; status: number; text: string }

export interface VisibilityInput {
  url: string
  /** The page as a plain, non-JavaScript reader receives it, fetched with an AI crawler's user agent. */
  page: Fetched
  robots: Fetched
  llms: Fetched
  sitemap: Fetched
}

export interface VisibilityCheck {
  id: string
  label: string
  status: 'pass' | 'warn' | 'fail'
  weight: number
  detail: string
  fix?: string
}

export interface VisibilityReport { url: string; score: number; checks: VisibilityCheck[]; checkedAt: string }

export const AI_CRAWLERS = ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended'] as const

/** Which of the named crawlers a robots.txt shuts out of the whole site. */
export function blockedCrawlers(robots: string): string[] {
  const blocked: string[] = []
  const groups = robots
    .split(/\r?\n\s*\r?\n/)
    .map(g => g.split(/\r?\n/).map(l => l.replace(/#.*$/, '').trim()).filter(Boolean))
  for (const bot of AI_CRAWLERS) {
    let verdict: 'block' | 'allow' | null = null
    let star: 'block' | 'allow' | null = null
    for (const g of groups) {
      const agents = g.filter(l => /^user-agent:/i.test(l)).map(l => l.split(':')[1].trim().toLowerCase())
      const rootRule = g.filter(l => /^disallow:/i.test(l)).some(l => l.split(':')[1].trim() === '/')
      const rootAllow = g.some(l => /^allow:\s*\/\s*$/i.test(l))
      const v = rootRule && !rootAllow ? 'block' : 'allow'
      if (agents.includes(bot.toLowerCase())) verdict = v
      if (agents.includes('*')) star = v
    }
    if ((verdict ?? star) === 'block') blocked.push(bot)
  }
  return blocked
}

const countWords = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1).length

export function gradeVisibility(i: VisibilityInput): VisibilityReport {
  const checks: VisibilityCheck[] = []
  const html = i.page.text
  const add = (c: VisibilityCheck) => checks.push(c)

  add(i.page.ok
    ? { id: 'reachable', label: 'The page loads for an AI crawler', status: 'pass', weight: 10, detail: `Answered with status ${i.page.status}.` }
    : { id: 'reachable', label: 'The page loads for an AI crawler', status: 'fail', weight: 10, detail: `The page answered ${i.page.status || 'nothing'} when fetched the way an AI crawler fetches it.`, fix: 'Make sure the page is public and that no firewall or bot rule refuses crawlers.' })

  const blocked = i.robots.ok ? blockedCrawlers(i.robots.text) : []
  add(blocked.length === 0
    ? { id: 'robots', label: 'AI crawlers are allowed in', status: 'pass', weight: 10, detail: i.robots.ok ? 'robots.txt does not shut out GPTBot, ClaudeBot, PerplexityBot or Google-Extended.' : 'No robots.txt, so nothing is blocked.' }
    : { id: 'robots', label: 'AI crawlers are allowed in', status: 'fail', weight: 10, detail: `robots.txt blocks: ${blocked.join(', ')}. They will not read this site.`, fix: 'Remove the Disallow: / rule for these crawlers if you want to be found in AI answers.' })

  const headTitle = /<title[^>]*>[^<]{3,}<\/title>/i.test(html)
  const headDesc = /<meta[^>]+name=["']description["'][^>]*content=["'][^"']{30,}["']/i.test(html)
  add(headTitle && headDesc
    ? { id: 'head', label: 'Title and description are in the HTML', status: 'pass', weight: 10, detail: 'A reader that does not run JavaScript gets both.' }
    : { id: 'head', label: 'Title and description are in the HTML', status: headTitle || headDesc ? 'warn' : 'fail', weight: 10, detail: `Missing: ${[!headTitle && 'title', !headDesc && 'description'].filter(Boolean).join(' and ')}.`, fix: 'Put a title and a 70-160 character description in the page HTML, not added by script.' })

  const n = countWords(html.replace(/<\/?noscript>/gi, ' '))
  add(n >= 150
    ? { id: 'content', label: 'The page text is there without JavaScript', status: 'pass', weight: 40, detail: `${n} words are readable without running any script.` }
    : { id: 'content', label: 'The page text is there without JavaScript', status: n >= 40 ? 'warn' : 'fail', weight: 40, detail: `Only ${n} words are readable without JavaScript. Most AI crawlers see this and nothing more.`, fix: 'Serve the main text in the HTML itself (a static or server-rendered page, or a text copy inside <noscript>).' })

  add(/<h1[\s>]/i.test(html)
    ? { id: 'h1', label: 'A main heading is in the HTML', status: 'pass', weight: 5, detail: 'Found an <h1>.' }
    : { id: 'h1', label: 'A main heading is in the HTML', status: 'warn', weight: 5, detail: 'No <h1> without JavaScript.', fix: 'Add one <h1> that says what the page is about.' })

  add(/application\/ld\+json/i.test(html)
    ? { id: 'schema', label: 'Structured data says what the business is', status: 'pass', weight: 10, detail: 'JSON-LD found.' }
    : { id: 'schema', label: 'Structured data says what the business is', status: 'warn', weight: 10, detail: 'No JSON-LD, so assistants have to guess what kind of business this is.', fix: 'Add schema.org JSON-LD (LocalBusiness, Organization, FAQPage as fits).' })

  const llmsReal = i.llms.ok && countWords(i.llms.text) >= 30 && !/<html/i.test(i.llms.text)
  add(llmsReal
    ? { id: 'llms', label: 'A plain-text summary for AI (llms.txt)', status: 'pass', weight: 5, detail: 'llms.txt is present and has content.' }
    : { id: 'llms', label: 'A plain-text summary for AI (llms.txt)', status: 'warn', weight: 5, detail: 'No llms.txt. It is optional and not every assistant reads it, but those that do get a clean summary.', fix: 'Publish /llms.txt with what you do, where, and your main pages.' })

  add(i.sitemap.ok && /<urlset|<sitemapindex/i.test(i.sitemap.text)
    ? { id: 'sitemap', label: 'A sitemap lists the pages', status: 'pass', weight: 10, detail: 'sitemap.xml found.' }
    : { id: 'sitemap', label: 'A sitemap lists the pages', status: 'warn', weight: 10, detail: 'No sitemap.xml found.', fix: 'Publish /sitemap.xml so crawlers find every page.' })

  const total = checks.reduce((s, c) => s + c.weight, 0)
  const got = checks.reduce((s, c) => s + (c.status === 'pass' ? c.weight : c.status === 'warn' ? c.weight * 0.4 : 0), 0)
  return { url: i.url, score: Math.round((got / total) * 100), checks, checkedAt: new Date().toISOString() }
}
