import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { IntentPlanCard } from './IntentPlanCard'
import { copyFor } from '@/lib/intent/copy'
import { INTENT_LANGS } from '@/lib/intent/types'
import type { PlanSketch } from '@/lib/intent/plan'

const plan: PlanSketch = {
  title: 'GSTR-2B Purchase Matcher',
  kind: 'web_app',
  screens: [
    { name: 'Upload Files', note: 'Upload the purchase register and the GSTR-2B file' },
    { name: 'Unmatched List', note: 'See which supplier invoices are missing' },
    { name: 'Mark Resolved', note: 'Tick off the ones you have chased' },
  ],
  data: ['Purchase invoices', 'Supplier GSTIN', 'Match status'],
  firstWin: 'You see every missing supplier invoice in one list.',
}

// React writes an apostrophe as &#x27; in markup; compare against the readable text.
const render = (p: PlanSketch, lang: (typeof INTENT_LANGS)[number]) =>
  renderToStaticMarkup(createElement(IntentPlanCard, { plan: p, c: copyFor(lang) })).replace(/&#x27;/g, "'")

describe('IntentPlanCard', () => {
  it.each(INTENT_LANGS)('renders the whole sketch in %s with the right labels', (lang) => {
    const html = render(plan, lang)
    const c = copyFor(lang)
    for (const s of [c.planTitle, c.planScreens, c.planData, c.planFirstWin, c.planNote, c.planKinds.web_app]) {
      expect(html).toContain(s)
    }
    expect(html).toContain('GSTR-2B Purchase Matcher')
    for (const s of plan.screens) { expect(html).toContain(s.name); expect(html).toContain(s.note) }
    for (const d of plan.data) expect(html).toContain(d)
    expect(html).toContain(plan.firstWin)
    expect(html).toContain('data-intent-plan')
  })

  it('shows the matching kind label for each product type', () => {
    for (const kind of ['mobile_app', 'website', 'saas'] as const) {
      expect(render({ ...plan, kind }, 'gu')).toContain(copyFor('gu').planKinds[kind])
    }
  })

  it('escapes anything that slipped through instead of rendering it as markup', () => {
    const html = render({ ...plan, title: '<img src=x onerror=alert(1)>', firstWin: '<script>alert(1)</script>' }, 'en')
    expect(html).not.toContain('<img src=x')
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('does not claim to be the real plan: it says it is a sketch', () => {
    expect(render(plan, 'en')).toMatch(/sketch/i)
  })
})
