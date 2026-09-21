import { describe, it, expect } from 'vitest'
import { forgeLine, buildStagedPlan, parsePlanManifest, diffPlannedAgainstWritten, type PlannedFile } from './staged-plan'

describe('forgeLine', () => {
  it('uses a normal purpose as-is', () => {
    expect(forgeLine([{ path: 'src/components/KanbanBoard.tsx', purpose: 'a drag-and-drop kanban board' }], 'fill'))
      .toBe('Building the drag-and-drop kanban board')
  })

  // Regression: seen live in production — Atlas's plan listed wyber-store.ts
  // with a self-note purpose ("DO NOT CREATE - platform injected local-first
  // storage"), and forgeLine surfaced it verbatim as the user-facing progress
  // line ("Building the DO NOT CREATE - platform injected local-first
  // storage"), leaking internal planning metadata.
  it('skips a purpose that reads like an internal note, not a feature description', () => {
    const batch: PlannedFile[] = [{ path: 'src/wyber-store.ts', purpose: 'DO NOT CREATE - platform injected local-first storage' }]
    const line = forgeLine(batch, 'fill')
    expect(line).not.toContain('DO NOT')
    expect(line).not.toContain('platform injected')
    expect(line).toBe('Building wyber-store')
  })

  it('falls through to the next file\'s purpose when the first is an internal note', () => {
    const batch: PlannedFile[] = [
      { path: 'src/wyber-store.ts', purpose: 'DO NOT CREATE - platform injected local-first storage' },
      { path: 'src/components/Certificate.tsx', purpose: 'the certificate viewer and share dialog' },
    ]
    expect(forgeLine(batch, 'fill')).toBe('Building the certificate viewer and share dialog')
  })

  it('falls back to the filename when no purpose is usable', () => {
    expect(forgeLine([{ path: 'src/components/Foo.tsx', purpose: '' }], 'fill')).toBe('Building Foo')
  })

  it('scaffold phase ignores purposes entirely', () => {
    expect(forgeLine([{ path: 'src/App.tsx', purpose: 'DO NOT CREATE - already exists' }], 'scaffold'))
      .toBe('Laying the foundation — shell, theme, and navigation')
  })
})

describe('buildStagedPlan', () => {
  it('does not stage small apps', () => {
    const files: PlannedFile[] = [{ path: 'src/App.tsx', purpose: 'shell' }, { path: 'src/index.css', purpose: 'styles' }]
    expect(buildStagedPlan(files).shouldStage).toBe(false)
  })

  it('never stages against the real (currently disabled) default threshold, even for a large manifest', () => {
    // Documents the kill-switch itself: with the real STAGE_THRESHOLD (999),
    // every build one-shots regardless of size, by design, while the staged
    // pipeline is stabilised. If this test ever fails, it means someone
    // lowered STAGE_THRESHOLD back down — a real, intentional re-enable, not
    // a regression to "fix" by raising it again.
    const files: PlannedFile[] = Array.from({ length: 20 }, (_, i) => ({ path: `src/components/F${i}.tsx`, purpose: `feature ${i}` }))
    expect(buildStagedPlan(files).shouldStage).toBe(false)
  })

  it('stages larger apps and puts scaffold-hinted files first', () => {
    const files: PlannedFile[] = [
      { path: 'src/App.tsx', purpose: 'shell' },
      { path: 'src/index.css', purpose: 'styles' },
      { path: 'src/components/Sidebar.tsx', purpose: 'nav' },
      { path: 'src/components/A.tsx', purpose: 'feature a' },
      { path: 'src/components/B.tsx', purpose: 'feature b' },
    ]
    // STAGE_THRESHOLD is currently 999 — a deliberate kill-switch forcing
    // one-shot generation for all builds while the staged pipeline is
    // stabilised (see the comment on STAGE_THRESHOLD in staged-plan.ts).
    // The scaffold/fill-batching logic below still exists and still matters
    // for when staging is re-enabled, so exercise it via the optional
    // threshold override rather than via the real (disabled) default.
    const plan = buildStagedPlan(files, 3)
    expect(plan.shouldStage).toBe(true)
    expect(plan.scaffoldPaths).toEqual(['src/App.tsx', 'src/index.css', 'src/components/Sidebar.tsx'])
    expect(plan.fillBatches.flat().map(f => f.path)).toEqual(['src/components/A.tsx', 'src/components/B.tsx'])
  })
})

describe('diffPlannedAgainstWritten', () => {
  it('returns empty when every planned path was written', () => {
    const planned: PlannedFile[] = [
      { path: 'src/screens/HistoryScreen.tsx', purpose: 'history calendar' },
      { path: 'src/screens/SettingsScreen.tsx', purpose: 'settings' },
    ]
    expect(diffPlannedAgainstWritten(planned, ['src/screens/HistoryScreen.tsx', 'src/screens/SettingsScreen.tsx', 'App.tsx'])).toEqual([])
  })

  it('returns the subset that was never written, preserving purpose', () => {
    const planned: PlannedFile[] = [
      { path: 'src/screens/HistoryScreen.tsx', purpose: 'history calendar' },
      { path: 'src/screens/SettingsScreen.tsx', purpose: 'settings screen' },
      { path: 'App.tsx', purpose: 'wire new screens into navigation' },
    ]
    const missing = diffPlannedAgainstWritten(planned, ['src/screens/HistoryScreen.tsx'])
    expect(missing).toEqual([
      { path: 'src/screens/SettingsScreen.tsx', purpose: 'settings screen' },
      { path: 'App.tsx', purpose: 'wire new screens into navigation' },
    ])
  })

  it('matches exact paths only — a near-miss path is NOT treated as a match', () => {
    const planned: PlannedFile[] = [{ path: 'src/screens/SettingsScreen.tsx', purpose: 'settings' }]
    // Different casing/prefix — must not be silently accepted as "handled".
    const missing = diffPlannedAgainstWritten(planned, ['screens/SettingsScreen.tsx', 'src/Screens/SettingsScreen.tsx'])
    expect(missing).toEqual(planned)
  })

  it('returns empty for an empty planned array', () => {
    expect(diffPlannedAgainstWritten([], ['App.tsx'])).toEqual([])
  })
})

describe('parsePlanManifest', () => {
  it('parses a clean JSON array', () => {
    expect(parsePlanManifest('[{"path":"src/App.tsx","purpose":"shell"}]')).toEqual([{ path: 'src/App.tsx', purpose: 'shell' }])
  })

  it('tolerates markdown code fences around the JSON', () => {
    expect(parsePlanManifest('```json\n[{"path":"src/App.tsx","purpose":"shell"}]\n```')).toEqual([{ path: 'src/App.tsx', purpose: 'shell' }])
  })

  it('returns empty for unparseable input', () => {
    expect(parsePlanManifest('not json at all')).toEqual([])
  })
})
