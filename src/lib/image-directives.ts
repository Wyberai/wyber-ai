// Image directives — how generated apps get real imagery without ever shipping
// a broken or placeholder box.
//
// The builder writes a token where it wants an image:
//   <img src="{{wyber-image: serene mountain lake at dawn | 16:9}}" alt="…" />
//
// • Stored source keeps the token.
// • PREVIEW resolves every token to a tasteful, deterministic gradient SVG data
//   URI (resolveDirectivesForPreview) — always a valid <img src>, never broken,
//   no network/cost.
// • PUBLISH resolves tokens to real, PERSISTED images when image generation is
//   configured, else the same gradient fallback (so the live app is never broken).
//
// All functions here are pure and dependency-free so they unit-test cleanly.

export interface ImageDirective {
  token: string // the exact "{{wyber-image: … }}" text to replace
  prompt: string
  ratio: string // normalized "WxH"
}

// {{wyber-image: <prompt> [| <ratio>] }}  — ratio optional.
const DIRECTIVE_RE =
  /\{\{\s*wyber-image\s*:\s*([^|}]+?)\s*(?:\|\s*([^}]+?)\s*)?\}\}/gi

/** Normalize a ratio hint to "WxH" pixels (used for SVG size + DALL·E size). */
export function ratioToSize(ratio?: string): string {
  const r = (ratio || '').trim().toLowerCase()
  if (r === '1:1' || r === 'square' || r === '1024x1024') return '1024x1024'
  if (r === '9:16' || r === 'tall' || r === 'portrait' || r === '1024x1792') return '1024x1792'
  if (r === '16:9' || r === 'wide' || r === 'landscape' || r === 'banner' || r === '1792x1024') return '1792x1024'
  return '1792x1024' // default: a wide hero
}

function sizePx(ratio: string): { w: number; h: number } {
  const [w, h] = ratioToSize(ratio).split('x').map(Number)
  return { w: w || 1792, h: h || 1024 }
}

/** Find every distinct image directive across a file map. */
export function extractImageDirectives(files: Record<string, { content?: string } | string>): ImageDirective[] {
  const seen = new Map<string, ImageDirective>()
  for (const val of Object.values(files || {})) {
    const content = typeof val === 'string' ? val : (val?.content ?? '')
    if (!content) continue
    for (const m of content.matchAll(DIRECTIVE_RE)) {
      const token = m[0]
      if (!seen.has(token)) {
        seen.set(token, { token, prompt: (m[1] || '').trim(), ratio: ratioToSize(m[2]) })
      }
    }
  }
  return [...seen.values()]
}

/** Replace one specific token string everywhere it appears in the file map. */
export function replaceTokenInFiles<T extends Record<string, { content?: string } | string>>(
  files: T,
  token: string,
  replacement: string,
): T {
  const out: Record<string, { content?: string } | string> = {}
  for (const [path, val] of Object.entries(files)) {
    if (typeof val === 'string') {
      out[path] = val.split(token).join(replacement)
    } else {
      const content = val?.content ?? ''
      out[path] = content.includes(token) ? { ...val, content: content.split(token).join(replacement) } : val
    }
  }
  return out as T
}

// Deterministic, dependency-free hash → hue, so the same prompt always yields the
// same gradient (stable across preview/publish and re-renders).
function hashHue(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h) % 360
}

/** A tasteful gradient SVG as a data URI — always a valid <img src>. */
export function gradientDataUri(prompt: string, ratio: string): string {
  const { w, h } = sizePx(ratio)
  const hue = hashHue(prompt)
  const hue2 = (hue + 40) % 360
  const c1 = `hsl(${hue} 70% 56%)`
  const c2 = `hsl(${hue2} 72% 44%)`
  const c3 = `hsl(${(hue + 200) % 360} 65% 60%)`
  // A visible "this is a placeholder" label so a generated app never looks
  // broken/cheap while its real image is still resolving (or if the user hasn't
  // swapped their own in). Scaled to the image; hidden on very small tiles where
  // text would be illegible.
  const fs = Math.max(11, Math.round(Math.min(w, h) * 0.05))
  const showLabel = Math.min(w, h) >= 90
  const label = showLabel
    ? `<g font-family="system-ui,-apple-system,Segoe UI,sans-serif" text-anchor="middle" fill="#ffffff">` +
      `<text x="${w / 2}" y="${h / 2 - fs * 0.2}" font-size="${fs}" font-weight="700" opacity="0.92">Placeholder image</text>` +
      `<text x="${w / 2}" y="${h / 2 + fs * 1.15}" font-size="${Math.round(fs * 0.8)}" opacity="0.72">Tap to upload your own</text>` +
      `</g>`
    : ''
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>` +
    `<radialGradient id="r" cx="0.8" cy="0.15" r="0.6">` +
    `<stop offset="0" stop-color="${c3}" stop-opacity="0.55"/><stop offset="1" stop-color="${c3}" stop-opacity="0"/></radialGradient></defs>` +
    `<rect width="${w}" height="${h}" fill="url(#g)"/>` +
    `<rect width="${w}" height="${h}" fill="url(#r)"/>` +
    label +
    `</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** Resolve every token to its gradient fallback — used for preview and as the
 *  publish-time fallback when real image generation is unavailable. */
export function resolveDirectivesForPreview(content: string): string {
  if (!content || !content.includes('{{')) return content
  return content.replace(DIRECTIVE_RE, (_full, prompt: string, ratio?: string) =>
    gradientDataUri((prompt || '').trim(), ratioToSize(ratio)),
  )
}

/** Map a whole file's content (string) through preview resolution. */
export function resolveFilesForPreview(files: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [path, content] of Object.entries(files)) {
    out[path] = resolveDirectivesForPreview(content)
  }
  return out
}

export function hasImageDirectives(files: Record<string, { content?: string } | string>): boolean {
  return extractImageDirectives(files).length > 0
}
