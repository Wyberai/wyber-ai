import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Search Console (2026-11-09) showed 38 of about 254 known pages indexed. Part of the cause was in our own metadata:
 * the root layout set one absolute canonical (the homepage) that every page without its own canonical inherited, and the
 * docs layout set another (/docs) for every documentation page, so Google was told each of them was a duplicate.
 * These tests keep that from coming back.
 */
const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

describe('canonicals', () => {
  it('the root layout gives each page a canonical that points at itself', () => {
    expect(read('src/app/layout.tsx')).toMatch(/alternates:\s*\{\s*canonical:\s*'\.\/'\s*\}/)
  })

  it('the docs layout does not force one canonical on every documentation page', () => {
    expect(read('src/app/docs/layout.tsx')).not.toMatch(/canonical/)
  })
})

describe('sitemap', () => {
  const sitemap = read('src/app/sitemap.ts')

  it('does not list pages that say they should not be indexed', () => {
    // /gallery is noindex; /premier-league and /employees (a redirect) are not content pages.
    for (const p of ['/gallery', '/premier-league', '/employees', '/templates', '/login', '/signup']) {
      expect(sitemap).not.toContain('${base}' + p + '`')
    }
  })

  it('uses real dates instead of "now" (an always-fresh lastmod teaches Google to ignore it)', () => {
    expect(sitemap).not.toMatch(/lastModified:\s*now/)
    expect(sitemap).toContain('PSEO_UPDATED')
  })

  it('lists the core product pages and every docs page', () => {
    for (const p of ['/create', '/solve', '/agencies', '/mcp', '/marketplace']) expect(sitemap).toContain('${base}' + p + '`')
    expect(sitemap).toContain('DOC_NAV')
  })
})

describe('page titles', () => {
  // The site title template appends " | WyberAi", so a page title must not repeat the brand at the end.
  const files = ['build', 'complexity-guide', 'connectors', 'credits', 'security', 'tools', 'use-cases', 'premier-league', 'status', 'consult']
  for (const f of files) {
    it(`/${f} does not repeat the brand in its title`, () => {
      const src = read(`src/app/${f}/page.tsx`)
      const first = src.match(/title:\s*'([^']*)'/)
      expect(first).not.toBeNull()
      expect(first![1]).not.toMatch(/(\||—|-)\s*WyberAi\b/i)
    })
  }

  it('login and the thin client-drawn pages are kept out of the index', () => {
    expect(read('src/app/login/layout.tsx')).toMatch(/index:\s*false/)
    expect(read('src/app/templates/page.tsx')).toMatch(/index:\s*false/)
    expect(read('src/app/space-journey/page.tsx')).toMatch(/index:\s*false/)
  })

  it('pages that used to show the homepage title have their own', () => {
    expect(read('src/app/learn/layout.tsx')).toContain('title:')
    expect(read('src/app/community-programs/layout.tsx')).toContain('title:')
    expect(read('src/app/setup-call/page.tsx')).toContain('title:')
  })
})

describe('crawl paths', () => {
  it('robots.txt keeps crawlers out of the login-only areas (they redirect to /login and show as "Page with redirect")', () => {
    const robots = read('src/app/robots.ts')
    for (const p of ['/gtm/', '/ai-employees/', '/employees/', '/dashboard', '/api-keys', '/admin/']) expect(robots).toContain(`'${p}'`)
  })

  it('the footer links every page to the app-ideas hub and no longer links to a redirect', () => {
    const footer = read('src/components/signal/SignalFooter.tsx')
    expect(footer).toContain("'/build'")
    expect(footer).toContain("'/lovable-alternatives'")
    expect(footer).not.toContain("'/community'") // /community redirects to /gallery
  })
})

describe('structured data and llms.txt', () => {
  it('the pricing page carries FAQPage markup built from the visible questions', () => {
    const layout = read('src/app/pricing/layout.tsx')
    expect(layout).toContain("'@type': 'FAQPage'")
    expect(layout).toContain('PRICING_STRINGS')
  })

  it('every blog post has Article markup from its route layout', () => {
    const dir = path.join(process.cwd(), 'src/app/blog')
    const posts = fs.readdirSync(dir).filter(d => fs.existsSync(path.join(dir, d, 'page.tsx')))
    expect(posts.length).toBeGreaterThan(10)
    for (const p of posts) expect(fs.existsSync(path.join(dir, p, 'layout.tsx')), p).toBe(true)
  })

  it('llms.txt quotes the same plan credits and prices as the plan file (assistants repeat this text)', async () => {
    const { PLAN_FACTS, TOPUP_PACKS } = await import('./plans')
    const llms = read('public/llms.txt')
    const n = (v: number) => v.toLocaleString('en-US')
    expect(llms).toContain(`Starter $${PLAN_FACTS.starter.monthlyPrice}/month (${n(PLAN_FACTS.starter.credits)} credits)`)
    expect(llms).toContain(`Builder $${PLAN_FACTS.builder.monthlyPrice}/month (${n(PLAN_FACTS.builder.credits)} credits)`)
    expect(llms).toContain(`Pro $${PLAN_FACTS.pro.monthlyPrice}/month (${n(PLAN_FACTS.pro.credits)} credits)`)
    for (const t of TOPUP_PACKS) expect(llms).toContain(`$${t.price} for ${t.credits} credits`)
  })
})
