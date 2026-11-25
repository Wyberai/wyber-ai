/**
 * Readable text colour for an arbitrary background colour (a client's brand colour, for example).
 *
 * A fixed white label fails on mid-tone colours (teal, orange, a lighter indigo). This picks whichever of
 * black or white has the higher WCAG contrast against the background, so the label always has the best
 * contrast available. For some mid-tone colours neither reaches the 4.5:1 text target; for those the better
 * of the two is still returned, and `contrastRatio` lets a caller check.
 */

function channel(v: number): number {
  const s = v / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

/** Relative luminance of a #rgb or #rrggbb colour. Anything unparseable is treated as mid-grey. */
export function luminance(hex: string): number {
  let h = (hex || '').trim().replace(/^#/, '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  if (!/^[0-9a-f]{6}$/i.test(h)) return 0.2
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** '#ffffff' or '#000000', whichever reads better on `background`. */
export function readableOn(background: string): '#ffffff' | '#000000' {
  return contrastRatio('#ffffff', background) >= contrastRatio('#000000', background) ? '#ffffff' : '#000000'
}
