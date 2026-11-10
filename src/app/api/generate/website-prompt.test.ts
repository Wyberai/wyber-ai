import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// buildWebsiteSystemPrompt isn't exported, so guard the source text directly.
// Regression guard: the checklist once said multi-page mode was disabled while
// the MULTI-PAGE MODE section said it was enabled, which made the model drop
// pages the user had explicitly asked for.
const src = readFileSync(join(__dirname, 'route.ts'), 'utf8')

describe('website prompt multi-page consistency', () => {
  it('does not tell the model multi-page mode is disabled', () => {
    expect(src).not.toContain('multi-page mode is disabled')
    expect(src).not.toContain('Single page only — no react-router-dom')
  })

  it('checklist defers to MULTI-PAGE MODE for requested pages', () => {
    expect(src).toContain('Page structure matches the request')
    expect(src).toContain('MULTI-PAGE MODE')
  })
})
