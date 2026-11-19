// App Store Connect rejects a title or subtitle over 30 characters and keywords over 100 characters in total. The model is
// told the limits and still broke them (18 Nov 2026: subtitle 40, keywords 128), so the limits are enforced here, in code.

export const STORE_LIMITS = { title: 30, subtitle: 30, keywordsTotal: 100, description: 4000 } as const

/** Cut to `max` characters at a word boundary where one exists, without a dangling comma, colon or dash. */
export function fitText(text: string, max: number): string {
  const t = String(text ?? '').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  if (/\s/.test(t.charAt(max))) return cut.replace(/[\s,;:\-–—]+$/g, '') // the cut lands exactly on a word end
  const lastSpace = cut.lastIndexOf(' ')
  const base = lastSpace >= Math.floor(max * 0.6) ? cut.slice(0, lastSpace) : cut
  return base.replace(/[\s,;:\-–—]+$/g, '')
}

/** Keep whole keywords, in order, while the comma-joined total stays within the limit. */
export function fitKeywords(keywords: unknown, max: number = STORE_LIMITS.keywordsTotal): string[] {
  const list = Array.isArray(keywords) ? keywords.map((k) => String(k).trim()).filter(Boolean) : []
  const out: string[] = []
  let total = 0
  for (const k of list) {
    const add = (out.length ? 1 : 0) + k.length // the comma between keywords counts
    if (total + add > max) break
    out.push(k)
    total += add
  }
  return out
}

export function clampStoreListing<T extends Record<string, unknown>>(listing: T): T {
  const out: Record<string, unknown> = { ...listing }
  if (typeof out.title === 'string') out.title = fitText(out.title, STORE_LIMITS.title)
  if (typeof out.subtitle === 'string') out.subtitle = fitText(out.subtitle, STORE_LIMITS.subtitle)
  if (Array.isArray(out.keywords)) out.keywords = fitKeywords(out.keywords)
  if (typeof out.description === 'string') out.description = fitText(out.description, STORE_LIMITS.description)
  return out as T
}
