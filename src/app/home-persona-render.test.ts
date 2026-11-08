import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { buildPrior } from '@/lib/intent/prior'
import { PERSONAS } from '@/lib/intent/persona'
import { DOORS } from '@/lib/intent/types'

// The homepage is the main sales page. These render it on the server, as production does, and check the
// persona system cannot change it by accident: with no choice it is the original; with a choice it is rebuilt.

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }), usePathname: () => '/', useSearchParams: () => new URLSearchParams() }))

import { HomeClient } from './HomeClient'

const prior = buildPrior({ path: '/', utmSource: null, utmCampaign: null, utmContent: null, forParam: null, referer: null, country: 'IN', region: null, acceptLanguage: 'en-IN' })
const render = (props: Record<string, unknown>) => renderToStaticMarkup(createElement(HomeClient as never, props as never))

describe('homepage with the intent experiment', () => {
  it('with no choice it is the original page: original headline, no persona attributes, chooser not server-rendered', () => {
    const html = render({ initialCurrency: 'INR', intentPrior: prior })
    expect(html).toContain('Build any digital product.')
    expect(html).not.toContain('data-persona')
    expect(html).not.toContain('What brings you here?') // the chooser renders only after the browser has mounted
  })

  it('with the experiment off (no prior), a stale door cookie changes nothing', () => {
    const html = render({ initialCurrency: 'INR', intentPrior: null, initialDoor: 'business' })
    expect(html).toContain('Build any digital product.')
    expect(html).not.toContain('data-persona')
  })

  it('the US page never shows any of it, whatever the cookie says', () => {
    const html = render({ initialCurrency: 'USD', intentPrior: null, initialDoor: 'software' })
    expect(html).toContain('Build any digital product.')
    expect(html).not.toContain('data-persona')
    expect(html).not.toContain('You chose')
  })

  it('a returning "Solve a problem" visitor gets their page on the very first paint: headline, colour, order and the "You chose" bar', () => {
    const p = PERSONAS.business
    const html = render({ initialCurrency: 'INR', intentPrior: prior, initialDoor: 'business' })
    expect(html).toContain('data-persona="business"')
    expect(html).toContain(p.hero!.heroLine1)
    expect(html).not.toContain('Build any digital product.')
    expect(html).toContain(p.accent!.accent)
    expect(html).toContain('[data-sec="telemetry"]{display:none !important}')
    expect(html).toContain('.mk-page[data-persona] > footer{order:9999}')
    expect(html).toContain('You chose: Solve a problem.')
    expect(html).toContain(p.finalCta!.finalCtaLine1)
  })

  it('a returning "Build apps" visitor gets different words and a different colour', () => {
    const html = render({ initialCurrency: 'INR', intentPrior: prior, initialDoor: 'software' })
    expect(html).toContain(PERSONAS.software.hero!.heroLine1)
    expect(html).not.toContain(PERSONAS.business.hero!.heroLine1)
    expect(html).toContain(PERSONAS.software.accent!.accent)
    expect(html).toContain('You chose: Build apps.')
  })

  it('"Just scrolling" keeps the original headline and colours, and loses the templates, free-apps strips and other clutter', () => {
    const html = render({ initialCurrency: 'INR', intentPrior: prior, initialDoor: 'student' })
    expect(html).toContain('data-persona="student"')
    expect(html).toContain('Build any digital product.')
    expect(html).not.toContain('--brand-accent:')
    expect(html).toContain('You chose: Just scrolling.')
    for (const id of ['gallery', 'userbuilds', 'websites', 'byos', 'telemetry', 'journey', 'ph', 'projects', 'examples']) expect(html, id).toContain(`[data-sec="${id}"]{display:none !important}`)
    for (const id of ['mission', 'products', 'proof', 'pricing', 'faq', 'final']) expect(html, id).toContain(`[data-sec="${id}"]{order:`)
  })

  it('every section a persona hides is present in the markup (it is hidden by CSS, not deleted), so switching back is instant', () => {
    const html = render({ initialCurrency: 'INR', intentPrior: prior, initialDoor: 'business' })
    for (const id of ['hero', 'products', 'pricing', 'faq', 'final']) expect(html, id).toContain(`data-sec="${id}"`)
  })
})

describe('the question screen and the project pages', () => {
  it('a new visitor gets only the question on the very first paint: A, B and C, with the rest of the page hidden', () => {
    const html = render({ initialCurrency: 'INR', intentPrior: prior, initialAsking: true })
    expect(html).toContain('What are you looking to do?')
    expect(html).toContain('Solve a problem')
    expect(html).toContain('Build apps')
    expect(html).toContain('Just scrolling')
    for (const letter of ['>A<', '>B<', '>C<']) expect(html).toContain(letter)
    expect(html).toContain('data-asking')
    expect(html).toContain('.mk-page[data-asking] > [data-sec]{display:none !important}')
    expect(html).not.toContain('data-persona')
  })

  it('a visitor who has already answered never sees the question screen again, only the small "You chose" bar', () => {
    const html = render({ initialCurrency: 'INR', intentPrior: prior, initialDoor: 'software', initialAsking: true })
    expect(html).not.toContain('data-asking')
    expect(html).toContain('You chose: Build apps.')
  })

  for (const door of ['business', 'software'] as const) {
    it(`the "${PERSONAS[door].label}" page shows the four project types in its own words, and real examples`, () => {
      const b = PERSONAS[door].blocks!
      const html = render({ initialCurrency: 'INR', intentPrior: prior, initialDoor: door })
      expect(html).toContain(b.projectsTitle)
      for (const pr of b.projects) { expect(html, pr.title).toContain(pr.title); expect(html, pr.line).toContain(pr.line.replace(/'/g, '&#x27;')) }
      expect(html).toContain(b.examplesTitle)
      for (const e of b.examples) expect(html, e.slug).toContain(`href="/build/${e.slug}"`)
      expect(html).toContain('data-sec="projects"')
      expect(html).toContain('data-sec="examples"')
    })
  }

  it('the two project pages say different things about the same four project types', () => {
    const a = PERSONAS.business.blocks!, b = PERSONAS.software.blocks!
    expect(a.projects.map(p => p.target)).toEqual(b.projects.map(p => p.target))
    for (let i = 0; i < 4; i++) { expect(a.projects[i].title).not.toBe(b.projects[i].title); expect(a.projects[i].line).not.toBe(b.projects[i].line) }
  })

  it('the original page has neither block and no question', () => {
    const html = render({ initialCurrency: 'INR', intentPrior: prior })
    expect(html).not.toContain('data-sec="projects"')
    expect(html).not.toContain('What are you looking to do?')
  })

  it('the experiment off means none of it, even if the page is told the visitor is asking', () => {
    const html = render({ initialCurrency: 'INR', intentPrior: null, initialAsking: true })
    expect(html).not.toContain('data-asking')
    expect(html).toContain('Build any digital product.')
  })
})
