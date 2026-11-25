import { describe, it, expect, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { floorTierForProjectType } from './pricing'
import { creditCost, type ActionType } from '../credits'
import { floorBuildTier } from '../launch-ready'
import { floorWebsiteTier } from '../website-ready'
import { floorSaasTier } from '../saas-ready'
import { floorMobileTier } from '../mobile-ready'

// The connector must quote what /api/generate charges. generate raises every NEW build to its launch-ready minimum size tier when the
// flag for that project type is on, so a quote from the file count alone was too low (found 19 Nov 2026).
const FLAGS = ['NEXT_PUBLIC_WEBAPP_LAUNCH_READY', 'NEXT_PUBLIC_WEBSITE_LAUNCH_READY', 'NEXT_PUBLIC_SAAS_LAUNCH_READY', 'NEXT_PUBLIC_MOBILE_LAUNCH_READY']
const ACTION: Record<string, ActionType> = { 'web-app': 'web-build', mobile: 'mobile-build', website: 'website-build', saas: 'saas-build' }
const FLOOR: Record<string, (t: 'small' | 'medium' | 'large' | 'xl') => 'small' | 'medium' | 'large' | 'xl'> = { 'web-app': floorBuildTier, mobile: floorMobileTier, website: floorWebsiteTier, saas: floorSaasTier }

afterEach(() => vi.unstubAllEnvs())

describe('MCP price quote matches the builder', () => {
  it('flags on: each type uses its own floor, and the quote never drops below the floored price', () => {
    for (const f of FLAGS) vi.stubEnv(f, 'true')
    for (const type of Object.keys(ACTION)) {
      for (const tier of ['small', 'medium', 'large', 'xl'] as const) {
        const got = floorTierForProjectType(type, tier)
        expect(got, `${type} ${tier}`).toBe(FLOOR[type](tier))
        expect(creditCost(ACTION[type], 'fast', got)).toBeGreaterThanOrEqual(creditCost(ACTION[type], 'fast', tier))
      }
    }
  })

  it('flags on: a small saas or web app is quoted as a large build (the case that was under-quoted)', () => {
    for (const f of FLAGS) vi.stubEnv(f, 'true')
    for (const type of ['saas', 'web-app']) {
      expect(floorTierForProjectType(type, 'small')).toBe('large')
      expect(creditCost(ACTION[type], 'fast', floorTierForProjectType(type, 'small'))).toBeGreaterThan(creditCost(ACTION[type], 'fast', 'small'))
    }
  })

  it('flags off: the tier is left exactly as the file count gave it', () => {
    for (const f of FLAGS) vi.stubEnv(f, 'false')
    for (const type of Object.keys(ACTION)) for (const tier of ['small', 'medium', 'large', 'xl'] as const) expect(floorTierForProjectType(type, tier)).toBe(tier)
  })
})

describe('MCP route wording and wiring', () => {
  const route = fs.readFileSync(path.join(__dirname, '..', '..', 'app', 'api', 'mcp', 'route.ts'), 'utf8')

  it('both get_build_cost and start_build apply the launch-ready floor', () => {
    const n = (route.match(/floorTierForProjectType\(args\.project_type, resolveBuildTier/g) || []).length
    expect(n).toBe(2)
  })

  it('no longer promises an 8-10 minute build', () => {
    expect(route).not.toMatch(/8-10 minute/)
  })

  it('publish_to_web says what really happens (secrets block, database scan runs after)', () => {
    expect(route).not.toContain('Includes RLS security check')
    expect(route).toMatch(/exposed secret key blocks the publish/i)
    expect(route).toMatch(/runs right after publishing/i)
  })

  it('palette tool offers design directions and tells the caller how to use the id', () => {
    expect(route).toMatch(/pickerOptions\(args\.prompt, 3/)
    expect(route).toMatch(/palette_id/)
  })
})
