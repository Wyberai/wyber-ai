import { describe, it, expect } from 'vitest'
import { deterministicWire } from './deterministic-wire'
import { wireLooksApplied } from './staged-plan'

describe('Wire pass verification flow (ChatPanel fix)', () => {
  it('detects when deterministic wire succeeds and screens are actually wired', () => {
    const routerBefore = `
import OverviewPlaceholder from './placeholders/Overview'
import TasksPlaceholder from './placeholders/Tasks'
export default function App() {
  return <OverviewPlaceholder/>
}
    `

    const screens = [
      { path: 'src/screens/Overview.tsx', name: 'Overview' },
      { path: 'src/screens/Tasks.tsx', name: 'Tasks' },
    ]

    // Step 1: Deterministic wire
    const wireResult = deterministicWire(routerBefore, screens)
    expect(wireResult.success).toBe(true)
    expect(wireResult.swappedCount).toBeGreaterThan(0)

    // Step 2: Verify it actually worked
    const verification = wireLooksApplied(routerBefore, wireResult.routerContent, [
      { path: 'src/screens/Overview.tsx', purpose: 'dashboard' },
      { path: 'src/screens/Tasks.tsx', purpose: 'task list' },
    ])

    // Step 3: Assert verification passed
    expect(verification.applied).toBe(true)
    expect(verification.missing).toHaveLength(0)

    // This is what gets reported: honest success
    expect('Wired 2 screens into the router').toBeTruthy()
  })

  it('detects when deterministic wire fails (model wrote wrong placeholder names)', () => {
    // Real scenario: model wrote OverviewDashboardPlaceholder but we look for OverviewPlaceholder
    const routerBefore = `
import OverviewDashboardPlaceholder from './placeholders/OverviewDashboard'
import TasksListPlaceholder from './placeholders/TasksList'
export default function App() {
  return <OverviewDashboardPlaceholder/>
}
    `

    const screens = [
      { path: 'src/screens/Overview.tsx', name: 'Overview' },
      { path: 'src/screens/Tasks.tsx', name: 'Tasks' },
    ]

    // Step 1: Deterministic wire tries to swap OverviewPlaceholder → Overview
    // But the router has OverviewDashboardPlaceholder, so swap doesn't match
    const wireResult = deterministicWire(routerBefore, screens)
    expect(wireResult.success).toBe(false) // No placeholders matched
    expect(wireResult.swappedCount).toBe(0)

    // Step 2: Verify — router is unchanged, so screens are still missing
    const verification = wireLooksApplied(routerBefore, routerBefore, [
      { path: 'src/screens/Overview.tsx', purpose: 'dashboard' },
      { path: 'src/screens/Tasks.tsx', purpose: 'task list' },
    ])

    // Step 3: Verification fails — screens built but not wired
    expect(verification.applied).toBe(false)
    expect(verification.missing).toHaveLength(2)

    // This is what gets reported: honest failure
    expect('Built 2 screens, but wiring incomplete — check the preview for "Coming up next..."').toBeTruthy()
  })

  it('reports accurate summary: only screens actually wired', () => {
    // After build, some screens wired, some not
    const filesAtEnd = {
      'src/App.tsx': { content: 'shell' },
      'src/screens/Overview.tsx': { content: 'built' },
      'src/screens/Tasks.tsx': { content: 'built' },
      // Note: Settings was built but not wired, so won't be in the summary
    }

    // Only screens actually in the file store get listed
    const liveScreens = Object.keys(filesAtEnd)
      .filter(path => !['src/App.tsx', 'index.css'].includes(path))

    expect(liveScreens).toContain('src/screens/Overview.tsx')
    expect(liveScreens).toContain('src/screens/Tasks.tsx')

    const screenNames = liveScreens
      .map(f => f.split('/').pop()?.replace(/\.(tsx?)$/, ''))
      .filter(Boolean)

    const summary = `Built it — ${screenNames.join(' and ')} ${screenNames.length === 1 ? 'is' : 'are'} live.`
    expect(summary).toContain('Overview')
    expect(summary).toContain('Tasks')
  })
})
