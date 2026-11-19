import type { Direction } from '../design-directions'

const EDITORIAL = new Set(['editorial', 'type-led'])
const OPEN = new Set(['human', 'physical', 'tool'])

/** What the owner said about the feel they want. Each phrase prefers the directions that deliver it. */
const FEEL: { re: RegExp; fits: (d: Direction) => boolean }[] = [
  { re: /\b(editorial|magazine|journal|literary)\b/i, fits: d => EDITORIAL.has(d.group) },
  { re: /\b(photo-?led|photograph\w*|photos|imagery|visual)\b/i, fits: d => d.rules.heroMedia === 'photo' },
  { re: /\b(warm|friendly|cosy|cozy|homely|welcoming|family)\b/i, fits: d => d.palette.mode === 'light' && (OPEN.has(d.group) || EDITORIAL.has(d.group)) },
  { re: /\b(dark|cinematic|moody|night|dramatic)\b/i, fits: d => d.palette.mode === 'dark' },
  { re: /\b(minimal|minimalist|clean|simple|quiet|calm)\b/i, fits: d => d.group === 'light-tech' || d.group === 'type-led' },
  { re: /\b(bold|loud|playful|colou?rful|vibrant)\b/i, fits: d => d.group === 'brand-block' },
  { re: /\b(luxury|luxurious|premium|elegant|refined)\b/i, fits: d => d.group === 'editorial' || d.group === 'dark' },
  { re: /\b(dense|data|spreadsheet|compact|no-?nonsense|practical)\b/i, fits: d => d.group === 'tool' || d.group === 'light-tech' },
]

export function feelScore(prompt: string, d: Direction): number {
  return FEEL.reduce((n, f) => n + (f.re.test(prompt) && f.fits(d) ? 1 : 0), 0)
}
