import { describe, it, expect } from 'vitest'
import { deterministicWire } from './deterministic-wire'

describe('deterministicWire', () => {
  it('swaps placeholder component names for real ones', () => {
    const router = `
import OverviewPlaceholder from './placeholders/Overview'
import PipelinePlaceholder from './placeholders/Pipeline'

export default function App() {
  return (
    <div>
      <OverviewPlaceholder/>
      <PipelinePlaceholder/>
    </div>
  )
}
    `
    const built = [
      { path: 'src/screens/Overview.tsx', name: 'Overview' },
      { path: 'src/screens/Pipeline.tsx', name: 'Pipeline' },
    ]

    const result = deterministicWire(router, built)

    expect(result.success).toBe(true)
    expect(result.swappedCount).toBe(4) // 2 imports + 2 usages
    expect(result.routerContent).toContain('import Overview from')
    expect(result.routerContent).toContain('import Pipeline from')
    expect(result.routerContent).toContain('<Overview/>')
    expect(result.routerContent).toContain('<Pipeline/>')
    expect(result.routerContent).not.toContain('Placeholder')
  })

  it('successfully wires built screens and leaves others as placeholders', () => {
    const router = `
import OverviewPlaceholder from './placeholders/Overview'
import PipelinePlaceholder from './placeholders/Pipeline'
export default function App() {
  return <>
    <OverviewPlaceholder/>
    <PipelinePlaceholder/>
  </>
}
    `
    // Only built Overview, not Pipeline
    const built = [{ path: 'src/screens/Overview.tsx', name: 'Overview' }]

    const result = deterministicWire(router, built)

    // Success because we wired all the screens we were asked to (Overview)
    // Pipeline stays as a placeholder because it wasn't built
    expect(result.success).toBe(true)
    expect(result.swappedCount).toBe(2) // 1 import + 1 usage for Overview
    expect(result.missingScreens).toHaveLength(0)
    expect(result.routerContent).toContain('import Overview from')
    expect(result.routerContent).toContain('PipelinePlaceholder') // not wired
  })

  it('returns success=true when all screens are wired', () => {
    const router = `
import AccountsPlaceholder from './placeholders/Accounts'
import SettingsPlaceholder from './placeholders/Settings'
export default () => <AccountsPlaceholder /> || <SettingsPlaceholder/>
    `
    const built = [
      { path: 'src/screens/Accounts.tsx', name: 'Accounts' },
      { path: 'src/screens/Settings.tsx', name: 'Settings' },
    ]

    const result = deterministicWire(router, built)

    expect(result.success).toBe(true)
    expect(result.missingScreens).toHaveLength(0)
  })

  it('handles edge case where built screen has no placeholder to swap', () => {
    const router = `
import Overview from './screens/Overview'
export default () => <Overview/>
    `
    const built = [{ path: 'src/screens/Overview.tsx', name: 'Overview' }]

    const result = deterministicWire(router, built)

    // No OverviewPlaceholder found in router to swap
    // This is unusual (scaffold should write placeholders) but we track it
    expect(result.swappedCount).toBe(0)
    expect(result.missingScreens).toContain('src/screens/Overview.tsx')
    expect(result.success).toBe(false)
  })
})
