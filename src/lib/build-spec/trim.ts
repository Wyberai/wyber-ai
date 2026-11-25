// Live, 24 Nov 2026: a dental website fell back to the free-form build (and lost its art direction) because the model wrote an image
// description of 142 characters against a limit of 140, on both attempts. A length limit is a layout rule, not a reason to throw the
// whole structured build away. Text that is only a little too long is trimmed at a sentence or word boundary before it is checked;
// text that is far too long is left to the normal repair attempt, because cutting it would damage the meaning.

export interface PathIssue { path: string; message: string }

/** Largest overrun (as a share of the limit) that is trimmed instead of sent back to the model. */
export const MAX_TRIM_OVERRUN = 0.3

export function trimToLimit(s: string, max: number): string {
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  // Prefer to end on a full sentence when that keeps most of the text.
  let sentenceEnd = -1
  for (const m of cut.matchAll(/[.!?](?=\s|$)/g)) sentenceEnd = m.index ?? sentenceEnd
  if (sentenceEnd + 1 >= max * 0.7) return cut.slice(0, sentenceEnd + 1).trimEnd()
  const space = cut.lastIndexOf(' ')
  const base = space >= max * 0.6 && s[max] !== ' ' ? cut.slice(0, space) : cut
  return base.replace(/[\s,;:–—-]+$/u, '').trimEnd()
}

function parsePath(path: string): (string | number)[] {
  const out: (string | number)[] = []
  for (const part of path.split('.')) {
    const m = /^([^\[\]]+)((?:\[\d+\])*)$/.exec(part)
    if (!m) return []
    out.push(m[1])
    for (const idx of m[2].matchAll(/\[(\d+)\]/g)) out.push(Number(idx[1]))
  }
  return out
}

/** Trims every field the validator reported as "too long (n > max)" when it is only a little over. Returns a copy; the input is untouched. */
export function repairLengths<T>(value: T, issues: PathIssue[]): T {
  if (!value || typeof value !== 'object') return value
  const out = structuredClone(value) as unknown
  for (const issue of issues) {
    const m = /^too long \((\d+) > (\d+)\)/.exec(issue.message)
    if (!m) continue
    const len = Number(m[1]), max = Number(m[2])
    if (len > max * (1 + MAX_TRIM_OVERRUN)) continue
    const keys = parsePath(issue.path)
    if (!keys.length) continue
    let node = out as Record<string | number, unknown> | undefined
    for (let i = 0; i < keys.length - 1 && node; i++) node = node[keys[i]] as Record<string | number, unknown> | undefined
    const last = keys[keys.length - 1]
    if (node && typeof node[last] === 'string') node[last] = trimToLimit(node[last] as string, max)
  }
  return out as T
}
