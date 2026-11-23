// Transcript handling. Speech engines drop results, repeat phrases after an
// auto-restart, and leave stray spacing. None of this adds or changes meaning.

/** Collapse whitespace; trim. */
export function tidy(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

const LEADING_FILLER = /^(?:(?:um+|uh+|er+|hmm+|ah+|okay so|ok so|so basically|basically|actually|like)\b[\s,.]*)+/i
const FILLER_MID = /\b(?:um+|uh+|erm|hmm+)\b[,.]?\s*/gi

/** Light clean-up for the raw transcript: spacing, hesitations, stammered repeats. */
export function cleanTranscript(raw: string): string {
  let t = tidy(raw)
  t = t.replace(LEADING_FILLER, '')
  t = t.replace(FILLER_MID, '')
  // "I want I want a website" -> "I want a website" (same 2-4 word phrase said twice in a row)
  for (let n = 4; n >= 2; n--) {
    const re = new RegExp(String.raw`(?<![\p{L}\p{N}])((?:\S+\s+){${n - 1}}\S+)(?:[\s,]+\1(?![\p{L}\p{N}]))+`, 'giu')
    t = t.replace(re, '$1')
  }
  t = tidy(t)
  if (t && /^[a-z]/.test(t)) t = t[0].toUpperCase() + t.slice(1)
  return t
}

/**
 * Join finalised segments with the newest piece, skipping a piece that the
 * engine re-sent after a restart (it repeats the tail of what we already have).
 */
export function appendSegment(existing: string, piece: string): string {
  const a = tidy(existing)
  const b = tidy(piece)
  if (!b) return a
  if (!a) return b
  const al = a.toLowerCase()
  const bl = b.toLowerCase()
  if (al.endsWith(bl)) return a
  // Longest suffix of `a` that is a prefix of `b` (restart overlap).
  const max = Math.min(al.length, bl.length)
  for (let k = max; k >= 8; k--) {
    if (al.endsWith(bl.slice(0, k))) return tidy(a + b.slice(k))
  }
  return `${a} ${b}`
}

export function wordCount(text: string): number {
  const t = tidy(text)
  return t ? t.split(' ').length : 0
}
