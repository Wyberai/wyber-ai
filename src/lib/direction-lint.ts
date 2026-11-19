// Non-blocking slop lint for a build made under a design direction. Pure: file map in, findings out.
// Like design-quality-check.ts this never gates or triggers regeneration by itself — callers decide
// whether to surface findings (e.g. to the self-heal lane or the first-build verification probe).

import type { Direction } from './design-directions'

type FileVal = { content?: string } | string
const contentOf = (v: FileVal | undefined): string => (typeof v === 'string' ? v : (v?.content ?? ''))

export interface DirectionFinding { rule: string; detail: string }

const GLOW_COMPONENTS = [
  'AuroraBackground', 'MeshGradient', 'StarField', 'GlowOrbsField', 'GlowOrbCard', 'LiquidBlob',
  'CursorGlow', 'CursorFollowBlob', 'HolographicCard', 'SpotlightSection', 'DottedSpotlight', 'WavesBackground',
]
const GRADIENT_RE = /\bbg-gradient-to-|\bgradient-to-|(?:linear|radial|conic)-gradient\(|bg-\[image:var\(--gradient/g
/**
 * Decorative gradients only. A 1–2px stop on transparent is a dot/line TEXTURE (a faint dotted grid is exactly what
 * some directions ask for), and a shimmer/skeleton gradient is loading UI — a real build tripped on both.
 */
function countGradients(text: string): number {
  let n = 0
  for (const m of text.matchAll(GRADIENT_RE)) {
    const i = m.index ?? 0
    if (/transparent\s+[12]px/.test(text.slice(i, i + 200))) continue
    if (/shimmer|skeleton/i.test(text.slice(Math.max(0, i - 160), i + 120))) continue
    n++
  }
  return n
}
const PURE_BLACK_RE = /#000000?\b|\btext-black\b|\bbg-black\b|\bborder-black\b/g
const PURPLE_RE = /\b(?:bg|text|border|ring|from|to|via)-(?:violet|purple|indigo|fuchsia)-\d{2,3}\b/g
const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
const REVEAL_RE = /<Reveal\b|<Stagger\b/g

const isUi = (path: string) => /\.(tsx|jsx|css|html)$/.test(path) && !/node_modules|wyber-ui|\.test\./.test(path)

export function lintAgainstDirection(files: Record<string, FileVal>, dir: Direction): DirectionFinding[] {
  const out: DirectionFinding[] = []
  const entries = Object.entries(files).filter(([p]) => isUi(p))
  const all = entries.map(([, v]) => contentOf(v)).join('\n')
  if (!all.trim()) return out

  if (!dir.rules.glow) {
    const used = GLOW_COMPONENTS.filter(c => new RegExp(`<${c}\\b`).test(all))
    if (used.length) out.push({ rule: 'no-glow', detail: `Glow/ambient effects used (${used.join(', ')}) but ${dir.name} forbids them` })
  }

  const gradients = countGradients(all)
  if (gradients > dir.rules.gradientBudget) {
    out.push({ rule: 'gradient-budget', detail: `${gradients} gradients found; ${dir.name} allows ${dir.rules.gradientBudget}` })
  }

  if (dir.rules.tintedInk) {
    const black = (all.match(PURE_BLACK_RE) ?? []).length
    if (black > 0) out.push({ rule: 'tinted-ink', detail: `${black} uses of pure black (#000 / text-black / bg-black); use the tinted foreground token` })
  }

  const purple = (all.match(PURPLE_RE) ?? []).length
  if (purple > 0) out.push({ rule: 'no-purple', detail: `${purple} violet/purple/indigo utility classes; use the direction's tokens` })

  const reveals = (all.match(REVEAL_RE) ?? []).length
  if (reveals >= 8) out.push({ rule: 'reveal-everywhere', detail: `${reveals} Reveal/Stagger wrappers; the direction asks for restrained, specific motion` })

  // fonts: the index.css should name both direction families
  const indexCss = entries.filter(([p]) => /index\.css$/.test(p)).map(([, v]) => contentOf(v)).join('\n')
  if (indexCss) {
    for (const [role, name] of [['display', dir.fonts.display], ['body', dir.fonts.body]] as const) {
      if (!indexCss.toLowerCase().includes(name.toLowerCase())) {
        out.push({ rule: 'direction-font', detail: `index.css does not apply the ${role} font "${name}"` })
      }
    }
  }

  const emojiIcon = entries.some(([, v]) => {
    const c = contentOf(v)
    return /lucide-react/.test(c) && EMOJI_RE.test(c.replace(/\/\/.*$/gm, ''))
  })
  if (emojiIcon) out.push({ rule: 'emoji-icon', detail: 'Emoji used alongside an icon library; use real icons' })

  return out
}
