import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { creditCost } from './credits'
import { launchReadyCost, launchReadyCostText } from './launch-ready'
import { websiteLaunchReadyCost } from './website-ready'
import { saasLaunchReadyCost } from './saas-ready'
import { mobileLaunchReadyCost } from './mobile-ready'

// Launch-ready must never charge LESS than today. A build the planner calls complex is charged at the 'default' price column
// (generate/route.ts pricingTier); a launch-ready flag may raise the tier floor but must not switch that column off.

describe('complex builds keep their price column', () => {
  it('the server still prices complex new builds at the default column for launch-ready builds', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/app/api/generate/route.ts'), 'utf8')
    const line = src.split('\n').find(l => l.includes('const pricingTier: ModelTier'))!
    expect(line).toMatch(/newBuildComplexity === true\) \? 'default' : tier/)
    expect(line).not.toMatch(/launchReadyBuild/)
  })

  it('shows the default-column price for a complex build and the fast-column price for a simple one', () => {
    expect(launchReadyCost(false).price).toBe(creditCost('web-build', 'fast', 'large'))
    expect(launchReadyCost(true).price).toBe(creditCost('web-build', 'default', 'large'))
    expect(launchReadyCost(true).price).toBeGreaterThan(launchReadyCost(false).price)
    expect(saasLaunchReadyCost(true).price).toBe(creditCost('saas-build', 'default', 'large'))
    expect(mobileLaunchReadyCost(true).price).toBe(creditCost('mobile-build', 'default', 'large'))
    expect(websiteLaunchReadyCost(true).price).toBe(creditCost('website-build', 'default', 'medium'))
    expect(launchReadyCostText(true)).toContain(String(creditCost('web-build', 'default', 'large')))
  })

  it('never undercuts the existing price: launch-ready price >= today\'s price for the same build size', () => {
    for (const col of ['fast', 'default'] as const) {
      expect(creditCost('web-build', col, 'large')).toBeGreaterThanOrEqual(creditCost('web-build', col, 'small'))
      expect(creditCost('saas-build', col, 'large')).toBeGreaterThanOrEqual(creditCost('saas-build', col, 'medium'))
    }
  })

  it('the editor estimates with the same column the server uses', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/components/editor/ChatPanel.tsx'), 'utf8')
    expect(src).toMatch(/const estimateTierName: ModelTier = anyLaunchReady && complexBuild \? 'default' : effectiveModelTier/)
    expect(src).toMatch(/launchReadyCostText\(complexBuild\)/)
  })
})
