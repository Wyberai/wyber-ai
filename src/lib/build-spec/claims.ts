/** Claims a model likes to invent. The owner never gave them, so copy that contains them is rejected and rewritten. */
export const BANNED_CLAIMS =
  /(\bbest\b|#1|\bnumber one\b|\bleading\b|\bworld-class\b|\bpremier\b|award[- ]winning|\bcertified\b|\bguarantee[sd]?\b|\bmoney-back\b|\btrusted by\b|\b\d{2,}\+?\s*(years|clients|customers|patients|students|happy|projects)\b|\bover \d+\b|!)/i

/** Words and digits that must never reach an image prompt. An image model paints any lettering it is given. */
export const IMAGE_BRIEF_BANNED = /(\d|\bwhatsapp\b|\bphone\b|\bcall\b|\bbook(?:ing)?\b|\benquir\w*\b|\bsigns?\b|\bsignage\b|\bposters?\b|\blogos?\b|\bbanners?\b|\bbrand name\b|\bwatermark\b|\bcaption\b|\bwritten\b|\bwords?\b|\btext\b)/i

/**
 * Removes the words in BANNED_CLAIMS from every string of a parsed reply ("!" becomes "."), without touching keys, numbers or structure.
 * Used as the LAST step of the model loop: when the only thing still wrong after the repair attempt is a stray unproven claim, the claim is
 * taken out and the reply re-checked, instead of throwing the whole build away. The honesty rule is unchanged; the claim never ships.
 */
export function scrubClaims<T>(value: T): T {
  const re = new RegExp(BANNED_CLAIMS.source, 'gi')
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') return v.replace(re, m => (m === '!' ? '.' : '')).replace(/\s{2,}/g, ' ').replace(/\s+([,.;:])/g, '$1').trim()
    if (Array.isArray(v)) return v.map(walk)
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, walk(x)]))
    return v
  }
  return walk(value) as T
}
