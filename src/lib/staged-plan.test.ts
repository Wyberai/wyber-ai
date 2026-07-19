import { describe, it, expect } from 'vitest'
import { forgeLine, buildStagedPlan, parsePlanManifest, type PlannedFile } from './staged-plan'

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

  it('stages larger apps and puts scaffold-hinted files first', () => {
    const files: PlannedFile[] = [
      { path: 'src/App.tsx', purpose: 'shell' },
      { path: 'src/index.css', purpose: 'styles' },
      { path: 'src/components/Sidebar.tsx', purpose: 'nav' },
      { path: 'src/components/A.tsx', purpose: 'feature a' },
      { path: 'src/components/B.tsx', purpose: 'feature b' },
    ]
    const plan = buildStagedPlan(files)
    expect(plan.shouldStage).toBe(true)
    expect(plan.scaffoldPaths).toEqual(['src/App.tsx', 'src/index.css', 'src/components/Sidebar.tsx'])
    expect(plan.fillBatches.flat().map(f => f.path)).toEqual(['src/components/A.tsx', 'src/components/B.tsx'])
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
