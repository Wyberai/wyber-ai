// Page titles. The root layout appends " | WyberAi" (10 characters) to every title, and search engines show about 60
// characters, so a page title longer than 50 gets cut mid-word in results. 27 pages were over the limit. For generated
// pages (the /build and /byos families) this keeps the title inside the limit: when the suffix would push it over, the
// brand suffix is dropped (the title stands alone); a title still over 60 is cut at the last separator or word.

const SUFFIX = ' | WyberAi'
export const TITLE_LIMIT = 60

/** A Next.js `title` value that renders at most TITLE_LIMIT characters in the browser tab and in results. */
export function fitTitle(title: string): string | { absolute: string } {
  const t = title.trim()
  if (t.length + SUFFIX.length <= TITLE_LIMIT) return t
  let s = t
  if (s.length > TITLE_LIMIT) {
    const cut = [' — ', ': ', ' - ', ', '].map(sep => s.lastIndexOf(sep)).filter(i => i > 20 && i <= TITLE_LIMIT).sort((a, b) => b - a)[0]
    s = cut !== undefined ? s.slice(0, cut) : s.slice(0, TITLE_LIMIT).replace(/\s+\S*$/, '')
  }
  return { absolute: s }
}

/** The rendered length of a title value, including the brand suffix the layout adds. */
export function renderedTitleLength(v: string | { absolute: string }): number {
  return typeof v === 'string' ? v.length + SUFFIX.length : v.absolute.length
}
