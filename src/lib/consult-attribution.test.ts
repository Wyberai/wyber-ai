import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { buildCalSrc } from './consult-attribution'

const BASE = 'https://cal.com/wyberai/wyber-ai-build-consultation'
const parse = (u: string) => new URL(u).searchParams

describe('buildCalSrc', () => {
  it('forwards the ad tags and the landing path', () => {
    const p = parse(buildCalSrc(BASE, '?utm_source=facebook&utm_medium=paid&utm_campaign=us-idea-call&utm_content=v2&fbclid=AbC123', '/us-consulting'))
    expect(p.get('utm_source')).toBe('facebook')
    expect(p.get('utm_campaign')).toBe('us-idea-call')
    expect(p.get('utm_content')).toBe('v2')
    expect(p.get('metadata[fbclid]')).toBe('AbC123')
    expect(p.get('metadata[landing]')).toBe('/us-consulting')
    expect(p.get('embed')).toBe('true')
  })
  it('still tells the pages apart when the ad has no tags', () => {
    const p = parse(buildCalSrc(BASE, '', '/india-consult'))
    expect(p.get('metadata[landing]')).toBe('/india-consult')
    expect(p.get('utm_source')).toBeNull()
  })
  it('ignores unknown parameters and cleans and caps the known ones', () => {
    const p = parse(buildCalSrc(BASE, '?email=a@b.c&name=Sam&utm_source=' + encodeURIComponent('x<script>alert(1)</script>' + 'y'.repeat(300)), '/consult'))
    expect(p.get('email')).toBeNull()
    expect(p.get('name')).toBeNull()
    expect(p.get('utm_source')!.length).toBeLessThanOrEqual(100)
    expect(p.get('utm_source')).not.toMatch(/[<>()]/)
  })
  it('does not put an odd path into the booking', () => {
    expect(parse(buildCalSrc(BASE, '', '/a/b?x=1')).get('metadata[landing]')).toBeNull()
  })
})

describe('the consulting page promises only what the process does', () => {
  const src = fs.readFileSync('src/app/consult/page.tsx', 'utf8')
  it('does not claim a track record or availability it cannot show', () => {
    expect(src).not.toMatch(/hundreds|thousands of|24\/7|same day|guarantee/i)
  })
  it('takes the free-credit number from the shared constant', () => {
    expect(src).toContain('${FREE_CREDITS}')
    expect(src).not.toMatch(/\b30 free credits\b/)
  })
  it('both campaign URLs still serve this page', () => {
    for (const f of ['src/app/us-consulting/page.tsx', 'src/app/india-consult/page.tsx']) expect(fs.readFileSync(f, 'utf8')).toContain("from '../consult/page'")
  })
})
