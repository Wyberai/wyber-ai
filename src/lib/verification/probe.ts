// First-build verification probe — pure evaluation half.
//
// The collector that runs INSIDE the preview iframe lives in
// lib/wyber-preview/bridge.ts (it must be an ES5 string). It posts back a plain
// ProbeSnapshot; everything here is pure data in → issues out, so it is fully
// unit-testable without a browser. Nothing in this file touches the network,
// the DOM, or any model.
//
// Phase 1 covers the `webapp` motion only (see docs/first-build-verification-plan.md).

export interface ProbeView {
  /** What was clicked to reach this view ('initial' for the first screen). */
  label: string
  /** Visible text length of #root. */
  textLength: number
  /** True when the preview's own error overlay (#wyber-error) is showing. */
  errorOverlay: boolean
  imgTotal: number
  imgBroken: number
  /** Count of `<a href="#">` links that go nowhere. */
  deadLinks: number
  /** Visible text matched a placeholder pattern (e.g. "Coming soon"). */
  placeholderText: string | null
  /** console.error / window.onerror messages seen while on this view. */
  errors: string[]
}

export interface ProbeSnapshot {
  views: ProbeView[]
  /** How many nav targets existed vs how many were actually visited. */
  navFound: number
  navVisited: number
}

export type ProbeIssueKind =
  | 'blank-screen'
  | 'error-overlay'
  | 'console-error'
  | 'broken-image'
  | 'dead-link'
  | 'placeholder-text'
  | 'no-navigation'

export interface ProbeIssue {
  kind: ProbeIssueKind
  view: string
  detail: string
}

export interface ProbeSpec {
  /** Minimum visible characters for a screen not to count as blank. */
  minTextLength: number
  /** A webapp with 3+ sections should expose at least this many nav targets. */
  minNavTargets: number
  /** Whether leftover placeholder copy is a failure. */
  flagPlaceholders: boolean
}

export const WEBAPP_SPEC: ProbeSpec = {
  minTextLength: 40,
  minNavTargets: 2,
  flagPlaceholders: true,
}

/** Phase 1 only knows webapp. Returns null for motions with no spec yet. */
export function getProbeSpec(projectType: string | undefined): ProbeSpec | null {
  if (projectType === undefined || projectType === 'webapp') return WEBAPP_SPEC
  return null
}

/** Strings that are expected in healthy previews and must never trigger a fix. */
const IGNORED_ERRORS = [
  /ResizeObserver loop/i,
  /Script error\.?$/i,
  /Failed to load resource/i,
  /favicon/i,
  /net::ERR_/i,
]

export function isIgnorableError(msg: string): boolean {
  return IGNORED_ERRORS.some(re => re.test(msg))
}

export function evaluateSnapshot(snapshot: ProbeSnapshot | null | undefined, spec: ProbeSpec): ProbeIssue[] {
  if (!snapshot || !Array.isArray(snapshot.views) || snapshot.views.length === 0) return []
  const issues: ProbeIssue[] = []

  for (const v of snapshot.views) {
    if (v.errorOverlay) {
      issues.push({ kind: 'error-overlay', view: v.label, detail: 'The preview error overlay is showing' })
      // An error overlay also reads as blank — don't double-report this view.
      continue
    }
    if (v.textLength < spec.minTextLength) {
      issues.push({ kind: 'blank-screen', view: v.label, detail: `Only ${v.textLength} characters of visible text` })
    }
    const realErrors = (v.errors || []).filter(e => !isIgnorableError(e))
    if (realErrors.length > 0) {
      issues.push({ kind: 'console-error', view: v.label, detail: realErrors[0].slice(0, 200) })
    }
    if (v.imgBroken > 0) {
      issues.push({ kind: 'broken-image', view: v.label, detail: `${v.imgBroken} of ${v.imgTotal} images failed to load` })
    }
    if (v.deadLinks > 0) {
      issues.push({ kind: 'dead-link', view: v.label, detail: `${v.deadLinks} links point to "#" and go nowhere` })
    }
    if (spec.flagPlaceholders && v.placeholderText) {
      issues.push({ kind: 'placeholder-text', view: v.label, detail: `Placeholder copy left in: "${v.placeholderText}"` })
    }
  }

  if (snapshot.navFound < spec.minNavTargets) {
    issues.push({
      kind: 'no-navigation',
      view: 'initial',
      detail: `Found ${snapshot.navFound} navigation target(s); a webapp needs at least ${spec.minNavTargets}`,
    })
  }

  return issues
}

const KIND_INSTRUCTION: Record<ProbeIssueKind, string> = {
  'blank-screen': 'Make this screen render real content.',
  'error-overlay': 'Fix the runtime error so the screen renders.',
  'console-error': 'Fix the runtime error that is logged on this screen.',
  'broken-image': 'Fix the image so it loads; use a {{wyber-image}} directive or remove it.',
  'dead-link': 'Point the link at a real destination or turn it into a real button.',
  'placeholder-text': 'Replace the placeholder with real, specific content for this app.',
  'no-navigation': 'Add working navigation between the main sections.',
}

/**
 * Builds the repair prompt handed to the existing wyber-autofix lane. Capped
 * so one verification round cannot write a novel; the lane's own repair caps
 * (MAX_AUTOFIX / MAX_TOTAL_REPAIR_PASSES) bound how many rounds run.
 */
export function buildProbeFixPrompt(issues: ProbeIssue[], max = 4): string {
  const lines = issues.slice(0, max).map(i => `- [${i.view}] ${i.detail}. ${KIND_INSTRUCTION[i.kind]}`)
  return (
    'I opened the finished app and used it like a person would. These problems showed up:\n' +
    lines.join('\n') +
    '\nFix only these. Output each changed file as a complete <file> block and do not restructure anything else.'
  )
}
