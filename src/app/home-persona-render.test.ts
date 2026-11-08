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
    expect(html).not.toContain('Showing the site for')
  })

  for (const door of DOORS) {
    it(`a returning ${door} gets their page on the very first paint: headline, colour, order and the compact "change" bar`, () => {
      const p = PERSONAS[door]
      const html = render({ initialCurrency: 'INR', intentPrior: prior, initialDoor: door })
      expect(html).toContain(`data-persona="${door}"`)
      expect(html).toContain(p.hero.heroLine1)
      expect(html).not.toContain('Build any digital product.')
      expect(html).toContain(p.accent.accent)
      expect(html).toContain('[data-sec="telemetry"]{display:none !important}')
      expect(html).toContain('.mk-page[data-persona] &gt; footer{order:9999}'.replace('&gt;', '>'))
      expect(html).toContain(`Showing the site for ${p.label}.`)
      expect(html).toContain(p.finalCta.finalCtaLine1)
    })
  }

  it('every section the persona hides is present in the markup (it is hidden by CSS, not deleted), so switching back is instant', () => {
    const html = render({ initialCurrency: 'INR', intentPrior: prior, initialDoor: 'business' })
    for (const id of ['hero', 'products', 'pricing', 'faq', 'final']) expect(html, id).toContain(`data-sec="${id}"`)
  })
})
