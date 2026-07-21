import { describe, it, expect } from 'vitest'
import {
  joinAllText,
  checkLegalPages,
  checkContactMethod,
  checkPlaceholderContent,
  findBrokenInternalLinks,
  checkSecurityScore,
  scoreChecks,
  scanLaunchReadiness,
  isLaunchReady,
} from './launch-readiness'

const files = (map: Record<string, string>) =>
  Object.fromEntries(Object.entries(map).map(([k, v]) => [k, { content: v }]))

describe('launch-readiness — legal pages', () => {
  it('flags high when no privacy/terms signal exists', () => {
    const c = checkLegalPages('const App = () => <div>Welcome</div>')
    expect(c.severity).toBe('high')
  })
  it('passes when privacy policy text is present', () => {
    const c = checkLegalPages('function Privacy() { return <p>Our Privacy Policy explains...</p> }')
    expect(c.severity).toBe('good')
  })
})

describe('launch-readiness — contact method', () => {
  it('flags high when nothing is found', () => {
    expect(checkContactMethod('<div>No way to reach us</div>').severity).toBe('high')
  })
  it('flags critical for a placeholder email', () => {
    const c = checkContactMethod('<a href="mailto:hello@example.com">Email</a>')
    expect(c.severity).toBe('critical')
  })
  it('passes for a real-looking email', () => {
    const c = checkContactMethod('<a href="mailto:support@acmebakery.in">Email</a>')
    expect(c.severity).toBe('good')
  })
  it('passes when a contact form exists', () => {
    const c = checkContactMethod('<form onSubmit={submit}><h2>Contact us</h2></form>')
    expect(c.severity).toBe('good')
  })
  it('passes for a tel: link', () => {
    expect(checkContactMethod('<a href="tel:+15551234567">Call</a>').severity).toBe('good')
  })
})

describe('launch-readiness — placeholder content', () => {
  it('flags lorem ipsum as critical', () => {
    const checks = checkPlaceholderContent('<p>Lorem ipsum dolor sit amet</p>')
    expect(checks.some((c) => c.id === 'placeholder-text' && c.severity === 'critical')).toBe(true)
  })
  it('flags placeholder image hosts', () => {
    const checks = checkPlaceholderContent('<img src="https://via.placeholder.com/300" />')
    expect(checks.some((c) => c.id === 'placeholder-image')).toBe(true)
  })
  it('flags stock testimonial names', () => {
    const checks = checkPlaceholderContent('<p>"Great!" — John Doe, CEO</p>')
    expect(checks.some((c) => c.id === 'stock-name')).toBe(true)
  })
  it('returns a single good check when clean', () => {
    const checks = checkPlaceholderContent('<p>Real copy about our actual bakery in Pune.</p>')
    expect(checks).toHaveLength(1)
    expect(checks[0].severity).toBe('good')
  })
})

describe('launch-readiness — broken internal links', () => {
  it('is good when there is no multi-page nav', () => {
    expect(findBrokenInternalLinks(files({ 'App.tsx': '<div>single page</div>' })).severity).toBe('good')
  })
  it('flags a link with no matching route', () => {
    const src = `
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <a href="/blog">Blog</a>
    `
    const c = findBrokenInternalLinks(files({ 'App.tsx': src }))
    expect(c.severity).toBe('medium')
    expect(c.detail).toContain('/blog')
  })
  it('passes when all links resolve, including dynamic segments', () => {
    const src = `
      <Route path="/" element={<Home />} />
      <Route path="/products/:id" element={<Product />} />
      <Link to="/products/42">A product</Link>
    `
    const c = findBrokenInternalLinks(files({ 'App.tsx': src }))
    expect(c.severity).toBe('good')
  })
  it('escalates to high with more than two broken links', () => {
    const src = `
      <Route path="/" element={<Home />} />
      <a href="/a">A</a><a href="/b">B</a><a href="/c">C</a>
    `
    const c = findBrokenInternalLinks(files({ 'App.tsx': src }))
    expect(c.severity).toBe('high')
  })
})

describe('launch-readiness — security score bonus', () => {
  it('is null when no score is provided', () => {
    expect(checkSecurityScore(undefined)).toBeNull()
  })
  it('flags high when the score is below 85', () => {
    expect(checkSecurityScore(40)?.severity).toBe('high')
  })
  it('passes when the score is 85+', () => {
    expect(checkSecurityScore(100)?.severity).toBe('good')
  })
})

describe('launch-readiness — scoring', () => {
  it('scores 100 with no non-good checks', () => {
    expect(scoreChecks([{ id: 'a', label: 'A', severity: 'good', detail: '' }])).toBe(100)
  })
  it('deducts per severity weight and floors at 0', () => {
    expect(
      scoreChecks([
        { id: 'a', label: 'A', severity: 'critical', detail: '' },
        { id: 'b', label: 'B', severity: 'critical', detail: '' },
        { id: 'c', label: 'C', severity: 'critical', detail: '' },
        { id: 'd', label: 'D', severity: 'critical', detail: '' },
        { id: 'e', label: 'E', severity: 'critical', detail: '' },
      ]),
    ).toBe(0)
  })
})

describe('scanLaunchReadiness — end to end', () => {
  it('produces a clean report for a well-built app', () => {
    const report = scanLaunchReadiness(
      files({
        'App.tsx': `
          <Route path="/" element={<Home />} />
          <Route path="/privacy" element={<Privacy />} />
          <a href="mailto:hello@acmebakery.in">Contact</a>
        `,
        'Privacy.tsx': '<p>Our Privacy Policy: we collect only what we need...</p>',
      }),
      { securityScore: 100 },
    )
    expect(report.checks.every((c) => c.severity === 'good')).toBe(true)
    expect(report.score).toBe(100)
  })

  it('stacks deductions for a rough, unfinished app', () => {
    const report = scanLaunchReadiness(
      files({
        'App.tsx': '<div>Lorem ipsum dolor sit amet <img src="https://via.placeholder.com/1" /></div>',
      }),
    )
    expect(report.score).toBeLessThan(100)
    expect(report.checks.some((c) => c.severity === 'critical')).toBe(true)
    // No securityScore passed → no security line item at all.
    expect(report.checks.some((c) => c.id === 'security')).toBe(false)
  })

  it('sorts by severity, most severe first', () => {
    const report = scanLaunchReadiness(files({ 'App.tsx': '<div>Lorem ipsum</div>' }))
    const ranks = report.checks.map((c) => c.severity)
    const order = ['critical', 'high', 'medium', 'good']
    const indices = ranks.map((r) => order.indexOf(r))
    expect([...indices].sort((a, b) => a - b)).toEqual(indices)
  })
})

describe('isLaunchReady', () => {
  it('is true only when score is 85+ AND there are no critical findings', () => {
    expect(isLaunchReady({ scannedAt: '', score: 90, checks: [{ id: 'a', label: 'A', severity: 'high', detail: '' }], passed: 0, total: 1 })).toBe(true)
    expect(isLaunchReady({ scannedAt: '', score: 90, checks: [{ id: 'a', label: 'A', severity: 'critical', detail: '' }], passed: 0, total: 1 })).toBe(false)
    expect(isLaunchReady({ scannedAt: '', score: 60, checks: [{ id: 'a', label: 'A', severity: 'good', detail: '' }], passed: 1, total: 1 })).toBe(false)
  })
})

describe('joinAllText', () => {
  it('handles both string and object file shapes', () => {
    expect(joinAllText({ a: 'raw string', b: { content: 'object shape' } })).toContain('raw string')
    expect(joinAllText({ a: 'raw string', b: { content: 'object shape' } })).toContain('object shape')
  })
})
