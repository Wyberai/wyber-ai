import { describe, it, expect } from 'vitest'
import { planPages } from './index'

describe('planPages', () => {
  it('always returns at least one page for any prompt', () => {
    expect(planPages('build me something completely generic', 'react-web').length).toBeGreaterThan(0)
  })

  it('falls back to home for a prompt matching no known archetype', () => {
    const specs = planPages('build a haiku generator', 'react-web')
    expect(specs).toHaveLength(1)
    expect(specs[0].archetype).toBe('home')
  })

  it('detects a single archetype keyword', () => {
    const specs = planPages('build a login page for my app', 'react-web')
    expect(specs.some(s => s.archetype === 'auth-login')).toBe(true)
  })

  it('detects multiple archetypes in one prompt', () => {
    const specs = planPages('build a dashboard with a settings page and a pricing page', 'react-web')
    const archetypes = specs.map(s => s.archetype)
    expect(archetypes).toContain('dashboard')
    expect(archetypes).toContain('settings')
    expect(archetypes).toContain('pricing')
  })

  it('carries the framework and paletteId through to every spec', () => {
    const specs = planPages('build a login page', 'react-native', 'sunset-01')
    for (const s of specs) {
      expect(s.framework).toBe('react-native')
      expect(s.paletteId).toBe('sunset-01')
    }
  })
})
