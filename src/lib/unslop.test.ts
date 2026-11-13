import { describe, it, expect } from 'vitest'
import { UNSLOP_ATTRIBUTION, UNSLOP_WEBAPP_RULES, scanSlopSource, slopIssues } from './unslop'

describe('prompt block', () => {
  it('credits the author and the licence, as CC BY 4.0 requires', () => {
    expect(UNSLOP_ATTRIBUTION).toMatch(/Damir Sokolovsky/)
    expect(UNSLOP_ATTRIBUTION).toMatch(/CC BY 4\.0/)
    expect(UNSLOP_ATTRIBUTION).toMatch(/github\.com\/heydamir\/unslop/)
    expect(UNSLOP_WEBAPP_RULES).toMatch(/Damir Sokolovsky/)
    expect(UNSLOP_WEBAPP_RULES).toMatch(/CC BY 4\.0/)
  })
  it('has ten rules and states that it overrides the older visual instructions', () => {
    for (let i = 1; i <= 10; i++) expect(UNSLOP_WEBAPP_RULES).toContain(`US${i} `)
    expect(UNSLOP_WEBAPP_RULES).toMatch(/this block wins/)
    for (const word of ['grain', 'mesh orbs', 'glow shadows', 'parallax', 'sparkline']) expect(UNSLOP_WEBAPP_RULES).toContain(word)
  })
  it('gives ramps in the HSL channel format our tokens use (no hsl() wrapper, no hex)', () => {
    expect(UNSLOP_WEBAPP_RULES).toMatch(/--background 0 0% 98%/)
    expect(UNSLOP_WEBAPP_RULES).not.toMatch(/--background #/)
    expect(UNSLOP_WEBAPP_RULES).not.toMatch(/--background hsl\(/)
  })
  it('bans the vague words unslop bans for the direction lines', () => {
    expect(UNSLOP_WEBAPP_RULES).toMatch(/never clean, modern, sleek, minimal, premium/)
  })
})

const SLOPPY = `
  <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">Welcome back, Asha! 👋</h1>
  <div className="shadow-[0_0_20px_rgba(139,92,246,0.5)] blur-3xl animate-ping mt-[13px] transition-all hover:scale-105 backdrop-blur-xl"/>
  <span className="uppercase tracking-widest text-xs">Navigation</span>
  <p>Supercharge your workflow with seamless AI</p>
  toast('Saved!')
  <Sparkline data={d}/>
`

describe('scanSlopSource', () => {
  it('finds the classic signs', () => {
    const r = scanSlopSource({ 'src/App.tsx': SLOPPY })
    const ids = r.issues.map(i => i.id)
    for (const id of ['gradient-text', 'hue-gradient', 'glow', 'blobs', 'grain-glass', 'emoji', 'uppercase-labels', 'heavy-type', 'odd-spacing', 'looping-motion', 'transition-all', 'exclamation', 'greeting', 'hype', 'sparkline-cards']) {
      expect(ids).toContain(id)
    }
    expect(r.score).toBeLessThan(40)
  })

  it('scores a quiet screen at or near 100', () => {
    const quiet = `
      <h1 className="text-2xl font-medium text-foreground">October 2026</h1>
      <div className="rounded-xl border border-border bg-card p-6 transition-colors hover:bg-muted">
        <p className="text-sm text-muted-foreground">Paid this month</p>
        <p className="text-3xl font-medium tabular-nums">₹1,84,000</p>
        <p className="text-sm text-muted-foreground">+12% vs last month</p>
      </div>
      <div className="h-4 w-full animate-pulse bg-muted" data-skeleton />
    `
    const r = scanSlopSource({ 'src/App.tsx': quiet })
    expect(r.issues).toEqual([])
    expect(r.score).toBe(100)
  })

  it('lets skeleton loaders pulse and ignores TypeScript non-null assertions and comparisons', () => {
    const r = scanSlopSource({ 'src/lib/db.ts': `const a = user!.name; if (x !== y) {} const sk = <div className="animate-pulse bg-muted skeleton"/>` })
    expect(r.issues.map(i => i.id)).not.toContain('exclamation')
    expect(r.issues.map(i => i.id)).not.toContain('looping-motion')
  })

  it('allows spacing values that are on the 4px scale and ignores the injected kit', () => {
    const r = scanSlopSource({ 'src/App.tsx': 'className="mt-[16px] w-[240px]"', 'src/wyber-ui.tsx': 'className="shadow-[0_0_20px_x] backdrop-blur-xl 🚀"' })
    expect(r.issues).toEqual([])
  })

  it('does not count comments as hype', () => {
    const r = scanSlopSource({ 'src/App.tsx': '// unlock the door\nconst x = 1' })
    expect(r.issues.map(i => i.id)).not.toContain('hype')
  })
})

describe('slopIssues', () => {
  it('returns at most three fix prompts, highest impact first', () => {
    const issues = slopIssues({ 'src/App.tsx': SLOPPY })
    expect(issues.length).toBe(3)
    expect(issues[0].fixPrompt).toMatch(/DESIGN CRAFT item/)
    expect(issues[0].detail).toMatch(/^Design:/)
  })
})
