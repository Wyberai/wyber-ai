import { describe, it, expect } from 'vitest'
import { fitTitle, renderedTitleLength, TITLE_LIMIT } from './seo-title'

describe('fitTitle', () => {
  it('leaves short titles alone so the brand suffix still applies', () => {
    expect(fitTitle('Pricing')).toBe('Pricing')
    expect(fitTitle('A'.repeat(50))).toBe('A'.repeat(50))
  })
  it('drops the brand suffix when that is enough', () => {
    const t = 'Build an Equipment & Fleet Maintenance Tracker with AI'
    expect(fitTitle(t)).toEqual({ absolute: t })
    expect(renderedTitleLength(fitTitle(t))).toBeLessThanOrEqual(TITLE_LIMIT)
  })
  it('cuts a long title at the last separator rather than mid-word', () => {
    const r = fitTitle('Build a Sports League Manager with AI, Fixtures and Standings and Much More Beyond')
    expect(renderedTitleLength(r)).toBeLessThanOrEqual(TITLE_LIMIT)
    expect((r as { absolute: string }).absolute).toBe('Build a Sports League Manager with AI')
  })
  it('falls back to a word boundary with no ellipsis', () => {
    const r = fitTitle('One extremely long title with no separator characters at all that just keeps going on and on')
    expect(renderedTitleLength(r)).toBeLessThanOrEqual(TITLE_LIMIT)
    expect((r as { absolute: string }).absolute.endsWith(' ')).toBe(false)
  })
  it('every real generated title fits', async () => {
    const { BUILD_PAGES } = await import('../app/build/data')
    for (const p of BUILD_PAGES) expect(renderedTitleLength(fitTitle(p.metaTitle)), p.slug).toBeLessThanOrEqual(TITLE_LIMIT)
  })
})
