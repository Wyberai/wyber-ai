import { describe, it, expect } from 'vitest'
import { blockedCrawlers, gradeVisibility, type Fetched } from './ai-visibility'

const ok = (text: string): Fetched => ({ ok: true, status: 200, text })
const none: Fetched = { ok: false, status: 404, text: '' }
const body = Array.from({ length: 200 }, (_, i) => `word${i}`).join(' ')
const goodPage = `<html><head><title>Smile Dental, Pune</title><meta name="description" content="Family dental clinic in Pune with same-week appointments and clear prices."><script type="application/ld+json">{"@type":"Dentist"}</script></head><body><h1>Smile Dental</h1><p>${body}</p></body></html>`

describe('blockedCrawlers', () => {
  it('reads a blanket block and a named block', () => {
    expect(blockedCrawlers('User-agent: *\nDisallow: /')).toContain('GPTBot')
    expect(blockedCrawlers('User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nAllow: /')).toEqual(['GPTBot'])
  })
  it('does not call a normal robots.txt a block', () => {
    expect(blockedCrawlers('User-agent: *\nDisallow: /admin\nSitemap: https://x.test/sitemap.xml')).toEqual([])
  })
  it('lets a named allow beat a blanket block', () => {
    expect(blockedCrawlers('User-agent: *\nDisallow: /\n\nUser-agent: ClaudeBot\nAllow: /')).not.toContain('ClaudeBot')
  })
})

describe('gradeVisibility', () => {
  it('scores a readable site high', () => {
    const r = gradeVisibility({ url: 'https://x.test', page: ok(goodPage), robots: ok('User-agent: *\nAllow: /'), llms: ok(body), sitemap: ok('<urlset></urlset>') })
    expect(r.score).toBe(100)
  })
  it('scores an empty JavaScript shell low and says why', () => {
    const shell = '<html><head><title>App</title></head><body><div id="root"></div><script src="/a.js"></script></body></html>'
    const r = gradeVisibility({ url: 'https://x.test', page: ok(shell), robots: none, llms: none, sitemap: none })
    expect(r.score).toBeLessThan(40)
    expect(r.checks.find(c => c.id === 'content')?.status).toBe('fail')
  })
  it('fails the crawler check when robots.txt shuts AI out', () => {
    const r = gradeVisibility({ url: 'https://x.test', page: ok(goodPage), robots: ok('User-agent: GPTBot\nDisallow: /'), llms: none, sitemap: none })
    expect(r.checks.find(c => c.id === 'robots')?.status).toBe('fail')
  })
  it('treats an HTML error page at llms.txt as missing', () => {
    const r = gradeVisibility({ url: 'https://x.test', page: ok(goodPage), robots: none, llms: ok(`<html><body>${body}</body></html>`), sitemap: none })
    expect(r.checks.find(c => c.id === 'llms')?.status).toBe('warn')
  })
})
