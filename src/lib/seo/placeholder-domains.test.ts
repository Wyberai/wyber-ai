import { describe, it, expect } from 'vitest'
import { fixPlaceholderDomains } from './placeholder-domains'

describe('fixPlaceholderDomains', () => {
  const html = `<link rel="canonical" href="https://dental-clinic-example.com/" />
<meta property="og:url" content="https://dental-clinic-example.com/" />
<meta property="og:image" content="https://dental-clinic-example.com/og.svg" />
<script type="application/ld+json">{"url":"https://dental-clinic-example.com/"}</script>
<p>Write to you@example.com</p>`

  it('points canonical, og:url and JSON-LD at the published address', () => {
    const out = fixPlaceholderDomains(html, 'dental-clinic-booking-hub')
    expect(out).toContain('rel="canonical" href="https://wyberai.com/app/dental-clinic-booking-hub/"')
    expect(out).toContain('"url":"https://wyberai.com/app/dental-clinic-booking-hub/"')
  })

  it('swaps the placeholder share image for the generated card', () => {
    const out = fixPlaceholderDomains(html, 'dental-clinic-booking-hub')
    expect(out).toContain('content="https://wyberai.com/api/og/app/dental-clinic-booking-hub"')
    expect(out).not.toContain('og.svg')
  })

  it('leaves no placeholder URL behind, and leaves an email address alone', () => {
    const out = fixPlaceholderDomains(html, 'x')
    expect(out).not.toMatch(/https?:\/\/[a-z0-9.-]*example\.com/)
    expect(out).toContain('you@example.com')
  })

  it('does nothing to a page with real addresses', () => {
    const real = '<link rel="canonical" href="https://smilecare.in/" />'
    expect(fixPlaceholderDomains(real, 'x')).toBe(real)
  })
})
