// staged-plan.ts
// Pure logic for Wyber staged generation: parse the plan manifest, decide
// whether to stage, and group files into safe-sized batches.
//
// Used by ChatPanel orchestration. No React, no network — easy to unit test.

export interface PlannedFile {
  path: string
  purpose: string
}

export interface StagedPlan {
  files: PlannedFile[]
  shouldStage: boolean
  scaffoldPaths: string[]   // files built in the scaffold pass (shell/theme/layout)
  fillBatches: PlannedFile[][] // remaining files, grouped into batches of 2-3
}

// Apps with fewer than this many files generate in one shot (no staging).
export const STAGE_THRESHOLD = 4
// Files per fill batch. Each fill pass gets a 24,000-token budget on Opus
// (see generate/route.ts's stageMaxTokens) — comfortable headroom for 2
// typical component files, which is why this was set conservatively low.
// Raised 2→3: a typical 6-9 file build was paying 3 full sequential API
// round-trips for the fill stage alone (network + generation latency each,
// observed 15-90s per pass depending on load) when 2 would often do,
// meaningfully cutting build wall-clock time for the common case. Any batch
// that genuinely needs more than the budget still hits the EXISTING
// max_tokens continuation safety net (see A3 in docs/failure-modes.md) rather
// than losing content — this doesn't remove that protection, it just asks
// for it less often.
export const FILL_BATCH_SIZE = 3

// Paths that belong in the scaffold pass: the shell that makes the preview
// render a skeleton immediately. Matched case-insensitively on the basename.
const SCAFFOLD_HINTS = [
  'index.css', 'app.tsx', 'app.jsx', 'main.tsx', 'main.jsx',
  'sidebar', 'layout', 'nav', 'navbar', 'shell', 'router', 'routes', 'theme',
]

function isScaffoldFile(path: string): boolean {
  const lower = path.toLowerCase()
  const basename = lower.split('/').pop() ?? lower
  // Match on basename or full path-suffix, not substring — prevents files like
  // src/navigation/ProfileScreen.tsx from being promoted to scaffold just
  // because their parent directory contains 'nav'.
  return SCAFFOLD_HINTS.some((h) => basename === h || basename.startsWith(h + '.') || lower.endsWith('/' + h))
}

/**
 * Parse the model's plan response into a manifest. The plan call is instructed
 * to return a JSON array of {path, purpose}. We tolerate code fences and stray
 * prose around the JSON.
 */
export function parsePlanManifest(raw: string): PlannedFile[] {
  if (!raw) return []
  // Strip markdown fences
  let text = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
  // Find the JSON array — anchor on [{" to skip any prose lists before the manifest
  const anchor = text.indexOf('[{')
  const start = anchor !== -1 ? anchor : text.indexOf('[')
  const end = text.lastIndexOf(']')
  if (start === -1 || end === -1 || end <= start) return []
  text = text.slice(start, end + 1)
  try {
    const parsed = JSON.parse(text)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((f) => f && typeof f.path === 'string' && f.path.trim().length > 0)
      .map((f) => ({
        path: f.path.trim(),
        purpose: typeof f.purpose === 'string' ? f.purpose.trim() : '',
      }))
  } catch {
    return []
  }
}

/**
 * Given a parsed manifest, build the staging plan: decide whether to stage,
 * split scaffold vs fill, and batch the fill files.
 */
export function buildStagedPlan(files: PlannedFile[]): StagedPlan {
  const shouldStage = files.length >= STAGE_THRESHOLD

  if (!shouldStage) {
    return { files, shouldStage: false, scaffoldPaths: [], fillBatches: [] }
  }

  const scaffold = files.filter((f) => isScaffoldFile(f.path))
  const fill = files.filter((f) => !isScaffoldFile(f.path))

  // Safety: if nothing matched scaffold hints, find the best candidate for a
  // shell file (App.tsx / index.* / main.*) rather than blindly taking fill[0]
  // which may be a data model or feature screen.
  if (scaffold.length === 0 && fill.length > 0) {
    const shellIdx = fill.findIndex(f => {
      const base = f.path.split('/').pop()?.toLowerCase() ?? ''
      return base.startsWith('app.') || base.startsWith('index.') || base.startsWith('main.')
    })
    const picked = shellIdx >= 0 ? fill.splice(shellIdx, 1)[0] : fill.shift()
    scaffold.push(picked as PlannedFile)
  }

  // Group fill files into small batches
  const fillBatches: PlannedFile[][] = []
  for (let i = 0; i < fill.length; i += FILL_BATCH_SIZE) {
    fillBatches.push(fill.slice(i, i + FILL_BATCH_SIZE))
  }

  return {
    files,
    shouldStage: true,
    scaffoldPaths: scaffold.map((f) => f.path),
    fillBatches,
  }
}

/**
 * Turn a batch's files into a short, human "Forge log" line for the chat UI.
 * Uses the feature purpose, not the filename, so it reads like a craftsman
 * narrating rather than a compiler logging.
 */
// Atlas (the plan step) sometimes lists a platform-provided file (e.g.
// wyber-store.ts) with a purpose that's a note to itself, not a feature
// description — "DO NOT CREATE - platform injected local-first storage" is a
// real one seen live. forgeLine used to surface that verbatim as "Building
// the DO NOT CREATE - platform injected local-first storage", leaking
// planning metadata into the user-facing progress line. Filter those out.
function looksLikeInternalNote(purpose: string): boolean {
  return /^do not\b/i.test(purpose)
    || /platform.injected/i.test(purpose)
    || /already (exists|provided)/i.test(purpose)
    || /^skip\b/i.test(purpose)
    || /injected by/i.test(purpose)
    || /handled by (platform|framework|wyber)/i.test(purpose)
    || /framework provides/i.test(purpose)
}

export function forgeLine(batch: PlannedFile[], phase: 'scaffold' | 'fill'): string {
  if (phase === 'scaffold') return 'Laying the foundation — shell, theme, and navigation'
  // Prefer the most descriptive purpose in the batch, skipping any that read
  // like an internal note rather than a feature description.
  const withPurpose = batch.find((f) => f.purpose && f.purpose.length > 4 && !looksLikeInternalNote(f.purpose))
  if (withPurpose) {
    // Clean the purpose into a short phrase
    const p = withPurpose.purpose.replace(/^(the|a|an)\s+/i, '').replace(/\.$/, '')
    return `Building the ${p}`
  }
  // Fallback to a friendly name derived from the file
  const name = batch[0].path.split('/').pop()?.replace(/\.(tsx|jsx|ts|js)$/, '') || 'feature'
  return `Building ${name}`
}
