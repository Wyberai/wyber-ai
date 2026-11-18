import { describe, it, expect } from 'vitest'
import { analyzeHtml } from './seo-audit'

describe('metadata streamed into the body', () => {
  it('still finds title, description, og, canonical and h1 placed after </head>', () => {
    const html = `<!DOCTYPE html><html lang="en"><head><meta name="viewport" content="width=device-width"></head><body><h1>Dental clinic in Pune</h1><script>self.__next_f.push([1,"x"])</script><title>Dental clinic | Check-ups, Cleaning, Fillings</title><meta name="description" content="Book a check-up, cleaning or filling at a dental clinic in Pune. Same-week appointments, clear prices and a sterile room."><meta property="og:title" content="Dental clinic"><meta property="og:image" content="https://x.test/og.png"><link rel="canonical" href="https://x.test/"></body></html>`
    const r = analyzeHtml('https://x.test/', html, false, false)
    for (const id of ['title', 'desc', 'og', 'canonical', 'h1']) expect(r.checks.find(c => c.id === id)?.severity, id).toBe('good')
  })
})
