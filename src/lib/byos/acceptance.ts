// After a Replace-your-SaaS build: does each feature the build says it made actually show up on a screen? The build writes
// src/replacement-checklist.ts (see REPLACEMENT_REQUIREMENTS in quote.ts). This reads that file and looks for each feature's name in
// the rest of the source. It reads code, not a running app, so it reports "present", not "works".

type FileVal = { content?: string } | string | undefined
const contentOf = (v: FileVal): string => (typeof v === 'string' ? v : (v?.content ?? ''))

export interface ChecklistFeature { name: string; status: 'built' | 'simplified'; note?: string }
export interface ReplacementFeatureResult extends ChecklistFeature { found: boolean }
export interface ReplacementResult {
  total: number
  present: number
  simplified: number
  missing: string[]
  features: ReplacementFeatureResult[]
}

const CHECKLIST_PATH = /(^|\/)replacement-checklist\.(ts|tsx)$/

export function parseChecklist(src: string): ChecklistFeature[] {
  const out: ChecklistFeature[] = []
  const re = /name\s*:\s*(['"`])((?:(?!\1)[^\\\n]|\\.)+)\1\s*,\s*status\s*:\s*(['"`])(built|simplified)\3(?:\s*,\s*note\s*:\s*(['"`])((?:(?!\5)[^\\\n]|\\.)*)\5)?/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src)) !== null) out.push({ name: m[2].trim(), status: m[4] as 'built' | 'simplified', note: m[6]?.trim() || undefined })
  return out
}

const STOP = new Set(['and', 'the', 'for', 'with', 'your', 'from', 'that', 'this', 'into', 'per', 'all', 'any', 'view', 'manage'])
// Light stemming so "forecasting" matches "forecast" and "invoices" matches "invoice".
const stem = (w: string) => { const s = w.replace(/(ing|ions?|ment|ed|es|s)$/, ''); return s.length >= 4 ? s : w }
const tokens = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 2 && !STOP.has(t)).map(stem)

/** A feature counts as present if its full name appears in a screen file, or most of its words do in the same file. */
function appears(name: string, screens: string[]): boolean {
  const full = name.toLowerCase()
  const words = [...new Set(tokens(name))]
  for (const code of screens) {
    const lower = code.toLowerCase()
    if (lower.includes(full)) return true
    if (words.length >= 2 && words.filter(w => lower.includes(w)).length >= Math.ceil(words.length * 0.75)) return true
    if (words.length === 1 && lower.includes(words[0])) return true
  }
  return false
}

export function checkReplacement(files: Record<string, FileVal>): ReplacementResult | null {
  const entries = Object.entries(files || {})
  const list = entries.find(([p]) => CHECKLIST_PATH.test(p))
  if (!list) return null
  const features = parseChecklist(contentOf(list[1]))
  if (features.length === 0) return null
  const screens = entries
    .filter(([p]) => /\.(tsx|jsx)$/.test(p) && !CHECKLIST_PATH.test(p) && !/wyber-ui|wyber-grow/.test(p))
    .map(([, v]) => contentOf(v))
  const results = features.map(f => ({ ...f, found: appears(f.name, screens) }))
  return {
    total: results.length,
    present: results.filter(f => f.found).length,
    simplified: results.filter(f => f.status === 'simplified').length,
    missing: results.filter(f => !f.found).map(f => f.name),
    features: results,
  }
}

export function replacementSummary(r: ReplacementResult): string {
  const base = `Replacement check: ${r.present} of ${r.total} features appear on a screen`
  const simp = r.simplified > 0 ? `, ${r.simplified} listed as simplified` : ''
  const miss = r.missing.length > 0 ? `. Adding: ${r.missing.slice(0, 4).join('; ')}${r.missing.length > 4 ? '…' : ''}` : '. This reads the source; it does not run the app.'
  return base + simp + miss
}

/** Missing features as fix prompts for the free fix lane (at most three per pass). */
export function replacementIssues(files: Record<string, FileVal>): { kind: 'launch-ready'; detail: string; fixPrompt: string }[] {
  const r = checkReplacement(files)
  if (!r) return []
  return r.features.filter(f => !f.found).slice(0, 3).map(f => ({
    kind: 'launch-ready' as const,
    detail: `Replacement feature missing: ${f.name}`,
    fixPrompt: `REPLACEMENT item missing: the feature "${f.name}" is listed in src/replacement-checklist.ts but no screen, button or menu entry is labelled with it. Build it as a working screen labelled "${f.name}" (or, if it truly cannot be built, change its status to "simplified" with a note saying what is cut). Change only what is needed and keep everything else working.`,
  }))
}
