import { describe, it, expect } from 'vitest'
import { assessDesignFreshness } from './design-quality-check'

const GENERIC_APP = `import { useState } from 'react'
export default function App() {
  return (
    <div className="flex h-screen bg-gray-950 text-zinc-100">
      <div className="p-8 border border-slate-800">
        <div className="bg-neutral-900 rounded p-4">Dashboard</div>
        <div className="bg-neutral-900 rounded p-4">Stats</div>
        <div className="bg-neutral-900 rounded p-4">Recent</div>
        <div className="bg-neutral-900 rounded p-4">Footer</div>
        <div className="bg-neutral-900 rounded p-4">More</div>
        <div className="bg-neutral-900 rounded p-4">Even more</div>
        <div className="bg-neutral-900 rounded p-4">Last one</div>
      </div>
    </div>
  )
}`

const FRESH_APP = `import { Reveal, BentoGrid, GlassPanel, SpotlightCard } from '@/wyber-ui'
export default function App() {
  return (
    <div className="bg-background text-foreground">
      <Reveal>
        <GlassPanel className="bg-card border-border">
          <BentoGrid>
            <SpotlightCard className="bg-primary text-primary-foreground">Hero</SpotlightCard>
          </BentoGrid>
        </GlassPanel>
      </Reveal>
    </div>
  )
}`

describe('assessDesignFreshness', () => {
  it('flags a build using only banned Tailwind grays and plain divs', () => {
    const result = assessDesignFreshness({ 'src/App.tsx': { content: GENERIC_APP } })
    expect(result).not.toBeNull()
    expect(result?.label).toBeTruthy()
  })

  it('does not flag a build using semantic tokens and kit primitives', () => {
    const result = assessDesignFreshness({ 'src/App.tsx': { content: FRESH_APP } })
    expect(result).toBeNull()
  })

  it('excludes auto-stub placeholder files from scoring', () => {
    const stub = '// Auto-stub: this file was imported but never generated (a long build that ran\n' + GENERIC_APP
    const result = assessDesignFreshness({ 'src/components/Missing.tsx': { content: stub } })
    expect(result).toBeNull()
  })

  it('never flags mobile builds — the Tailwind/kit signals do not apply to React Native', () => {
    const result = assessDesignFreshness({ 'App.tsx': { content: GENERIC_APP } }, 'mobile')
    expect(result).toBeNull()
  })

  it('returns null when there is nothing to scan', () => {
    expect(assessDesignFreshness({})).toBeNull()
  })
})
