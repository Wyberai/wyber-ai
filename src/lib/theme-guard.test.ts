import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * On 2026-11-09 the WyberCode and Tech Expo banners were invisible in light mode: they used the older --brand-text colour
 * variable, which has only a dark-theme value (near-white), on a pale background. The Signal theme remaps only its own
 * --sg-* variables, so anything placed on a Signal page must use those (or be a dark island that stays dark on purpose).
 */
const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

describe('light mode', () => {
  it('the announcement banners use Signal theme tokens, not the dark-only --brand-text', () => {
    const src = read('src/components/shared/LaunchStrip.tsx') + read('src/components/signal/StripClient.tsx')
    expect(src).toContain('var(--sg-hot')
    expect(src).toContain('var(--sg-soft')
    expect(src).not.toMatch(/color:\s*'var\(--brand-text/)
  })

  it('the dark-only pricing page sits in a dark island so the light toggle cannot make it unreadable', () => {
    expect(read('src/app/pricing/page.tsx')).toContain('sg-island-dark')
    const css = read('src/styles/signal.css')
    const block = css.slice(css.indexOf('.sg-island-dark {'))
    expect(block).toContain('--sg-ink: #e8eef7')
    expect(block).toContain('--sg-bg: #05080d')
  })

  it('the island is not a .sg element (the theme switch sets data-sg-theme on every .sg)', () => {
    expect(read('src/app/pricing/page.tsx')).not.toMatch(/className="sg [^"]*sg-island-dark|className="sg-island-dark sg"/)
  })

  it('the wordmark uses a darker sky for "Ai" on a light page', () => {
    expect(read('src/components/shared/WyberLogo.tsx')).toMatch(/theme === 'onLight' \? '#0369a1'/)
  })
})
