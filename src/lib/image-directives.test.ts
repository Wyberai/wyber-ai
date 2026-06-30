import { describe, it, expect } from 'vitest'
import {
  ratioToSize,
  extractImageDirectives,
  replaceTokenInFiles,
  gradientDataUri,
  resolveDirectivesForPreview,
  resolveFilesForPreview,
  hasImageDirectives,
} from './image-directives'

describe('image-directives — parsing', () => {
  it('normalizes ratio hints to DALL·E sizes', () => {
    expect(ratioToSize('16:9')).toBe('1792x1024')
    expect(ratioToSize('square')).toBe('1024x1024')
    expect(ratioToSize('tall')).toBe('1024x1792')
    expect(ratioToSize(undefined)).toBe('1792x1024') // default wide
  })

  it('extracts distinct directives with prompt + ratio', () => {
    const files = {
      'src/Hero.tsx': { content: '<img src="{{wyber-image: a calm mountain lake | 16:9}}" />' },
      'src/About.tsx': { content: 'x {{wyber-image: team working together}} y' },
      'src/Dup.tsx': { content: 'again {{wyber-image: a calm mountain lake | 16:9}}' },
    }
    const found = extractImageDirectives(files)
    expect(found).toHaveLength(2) // duplicate token collapses
    const lake = found.find((d) => d.prompt.includes('mountain'))!
    expect(lake.ratio).toBe('1792x1024')
    const team = found.find((d) => d.prompt.includes('team'))!
    expect(team.ratio).toBe('1792x1024') // default when no ratio
  })

  it('hasImageDirectives is true only when a token exists', () => {
    expect(hasImageDirectives({ a: 'no tokens here' })).toBe(false)
    expect(hasImageDirectives({ a: '{{wyber-image: x}}' })).toBe(true)
  })
})

describe('image-directives — replacement', () => {
  it('replaces a specific token everywhere, across string and object files', () => {
    const token = '{{wyber-image: a calm mountain lake | 16:9}}'
    const files = {
      'a.tsx': `<img src="${token}" />`,
      'b.tsx': { content: `again ${token}`, language: 'typescript' },
      'c.tsx': { content: 'untouched' },
    }
    const out = replaceTokenInFiles(files, token, 'https://cdn/img.png')
    expect(out['a.tsx']).toBe('<img src="https://cdn/img.png" />')
    expect((out['b.tsx'] as { content: string }).content).toBe('again https://cdn/img.png')
    expect((out['b.tsx'] as { language: string }).language).toBe('typescript') // metadata preserved
    expect(out['c.tsx']).toEqual({ content: 'untouched' })
  })
})

describe('image-directives — gradient fallback', () => {
  it('produces a valid, deterministic svg data URI', () => {
    const a = gradientDataUri('mountain lake', '1792x1024')
    const b = gradientDataUri('mountain lake', '1792x1024')
    expect(a).toBe(b) // deterministic
    expect(a.startsWith('data:image/svg+xml,')).toBe(true)
    expect(decodeURIComponent(a)).toContain('<svg')
    expect(decodeURIComponent(a)).toContain('linearGradient')
  })

  it('different prompts yield different gradients', () => {
    expect(gradientDataUri('ocean', '1792x1024')).not.toBe(gradientDataUri('forest', '1792x1024'))
  })

  it('resolveDirectivesForPreview swaps every token for a data URI', () => {
    const src = '<img src="{{wyber-image: ocean | 16:9}}" /> and {{wyber-image: forest}}'
    const out = resolveDirectivesForPreview(src)
    expect(out).not.toContain('{{wyber-image')
    expect((out.match(/data:image\/svg\+xml,/g) || []).length).toBe(2)
  })

  it('resolveFilesForPreview maps every file', () => {
    const out = resolveFilesForPreview({ 'a.tsx': '{{wyber-image: x}}', 'b.tsx': 'plain' })
    expect(out['a.tsx']).toContain('data:image/svg+xml,')
    expect(out['b.tsx']).toBe('plain')
  })

  it('leaves content without tokens untouched (fast path)', () => {
    expect(resolveDirectivesForPreview('no tokens')).toBe('no tokens')
  })
})
