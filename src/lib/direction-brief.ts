// Deal + brief rendering for design directions (see design-directions.ts).
//
// dealDirections()    — three (or n) DIFFERENT directions that fit the prompt, never the category default.
// pickDirection()     — one direction (an explicit id wins; otherwise the best fit, tie-broken randomly).
// renderDirectionBrief() — the instruction block injected into the generation prompt in place of
//                          renderDesignBrief()'s generic palette brief.

import { DIRECTIONS, getDirectionById, type Direction } from './design-directions'

export type ProjectSurface = 'website' | 'app'

/** webapp/saas builds are apps; everything else web-side is a website. */
export function surfaceFor(projectType: string | undefined): ProjectSurface {
  return projectType === 'webapp' || projectType === 'saas' ? 'app' : 'website'
}

// Generic words that appear in almost any brief ("booking form", "platform", "products"). They are weak evidence of a
// category, so they must never win a tie against a real business term (a law firm with a booking form is not a
// marketplace). Found by a real build: "law firm … booking form" was dealt the marketplace direction.
const WEAK_FITS = new Set([
  'booking', 'platform', 'platform for', 'products', 'tools', 'tool', 'store', 'shop', 'home', 'brand', 'event', 'program',
  'programme', 'tour', 'club', 'team', 'community', 'premium', 'collection', 'drink', 'catalogue', 'catalog', 'software',
  'plugin', 'hire', 'label', 'designer', 'wear', 'studio', 'creative', 'design', 'launch', 'utility', 'tracker', 'training',
  'cause', 'campaign', 'trust', 'society', 'directory', 'gallery', 'portfolio', 'lifestyle', 'organic', 'kids', 'consumer',
  'planner', 'notes', 'editor', 'canvas', 'stock', 'vendor', 'builder', 'developer',
])

/** Below this total a prompt has only weak evidence for a direction, so it is treated as "no signal". */
const MIN_EVIDENCE = 1

/**
 * Evidence that a direction fits the prompt. A direction's first three `fits` are its core business terms (weight 3),
 * the rest are supporting terms (1), generic words are weak (0.25), multi-word terms count 1.5×, and repeats count
 * (capped at 3) — "law firm … family law" is a stronger law signal than one mention of "property".
 */
function score(dir: Direction, prompt: string): number {
  const p = ` ${(prompt || '').toLowerCase()} `
  let s = 0
  dir.fits.forEach((f, i) => {
    const needle = f.toLowerCase()
    // whole-word-ish match so "tea" does not fire inside "steam"
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`(^|[^a-z])${escaped}(?:s|es)?(?=[^a-z]|$)`, 'g')
    const count = Math.min((p.match(re) ?? []).length, 3)
    if (!count) return
    const weight = WEAK_FITS.has(needle) ? 0.25 : i < 3 ? 3 : 1
    s += weight * count * (needle.includes(' ') ? 1.5 : 1)
  })
  return s
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Up to `n` distinct directions. Prompt-fit first (highest score), then diversity: prefer a group and a
 * light/dark mode not already picked, so the options genuinely look different side by side.
 */
export function dealDirections(
  prompt: string,
  n = 3,
  opts: { projectType?: string; rnd?: () => number } = {},
): Direction[] {
  const rnd = opts.rnd ?? Math.random
  const surface = surfaceFor(opts.projectType)
  const pool = DIRECTIONS.filter(d => d.surfaces.includes(surface))
  const scored = shuffle(pool, rnd).map(d => ({ d, s: score(d, prompt) })).sort((a, b) => b.s - a.s)
  const picked: Direction[] = []
  const hasSignal = (scored[0]?.s ?? 0) >= MIN_EVIDENCE
  const take = (cands: { d: Direction; s: number }[]) => {
    let rest = cands.slice()
    while (picked.length < n && rest.length) {
      const groups = new Set(picked.map(x => x.group))
      const modes = new Set(picked.map(x => x.palette.mode))
      let best = rest[0]
      let bestScore = -Infinity
      for (const c of rest) {
        const diversity = (groups.has(c.d.group) ? 0 : 2) + (modes.has(c.d.palette.mode) ? 0 : 1)
        const total = c.s * 3 + diversity
        if (total > bestScore) { best = c; bestScore = total }
      }
      picked.push(best.d)
      rest = rest.filter(c => c.d.id !== best.d.id)
    }
  }
  take(scored.filter(c => c.s >= MIN_EVIDENCE))
  // Filler options (nothing in the library fits well): for a multi-option picker prefer directions that work for
  // almost any business, so a bakery is never offered a law-firm wordmark. A single pick keeps the full pool
  // so vague prompts still vary build to build.
  const zero = scored.filter(c => c.s < MIN_EVIDENCE)
  // No real signal in the prompt (e.g. "a no-code form builder"): never gamble on a niche direction. Use the neutral
  // defaults for the surface (apps: appDefault; websites: generalist), which still vary build to build.
  const neutral = (c: { d: Direction }) => (surface === 'app' ? c.d.appDefault : c.d.generalist)
  if (n > 1 || !hasSignal) take(zero.filter(neutral))
  take(zero)
  return picked
}

/** An explicit id (user chose it in Plan Mode) wins; otherwise the best fit for the prompt. */
export function pickDirection(
  prompt: string,
  opts: { id?: string | null; projectType?: string; rnd?: () => number } = {},
): Direction {
  const explicit = getDirectionById(opts.id)
  if (explicit) return explicit
  return dealDirections(prompt, 1, opts)[0]
}

const TOKEN_ORDER = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
  'primary', 'primary-foreground', 'secondary', 'secondary-foreground',
  'muted', 'muted-foreground', 'accent', 'accent-foreground',
  'destructive', 'destructive-foreground', 'border', 'input', 'ring',
]
const FALLBACK = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"

const HERO_MEDIA_LINE: Record<string, string> = {
  photo: 'The hero is ONE large photograph. Use a {{wyber-image}} directive with the image brief below.',
  video: 'The hero is full-bleed video or a slow-pan still sequence (use {{wyber-image}} stills if no video exists).',
  illustration: 'The hero is a flat illustration, not a photograph. Generate it with {{wyber-image}} as flat vector-style art on a transparent or flat background.',
  type: 'The hero is TYPE: a huge headline/word at the display scale below. No hero image behind it.',
  'product-ui': 'The hero is the product UI itself, built from real components at real size. No abstract art.',
  'gradient-field': 'The hero is a single-hue gradient field (the --gradient-hero token). One per screen.',
  'line-art': 'The hero is fine line art (elevation/plan/diagram) generated as clean linework with {{wyber-image}}, on the ground colour.',
  cutouts: 'The hero is isolated cut-out photography on the flat ground colour ({{wyber-image}} with a plain background).',
  'spec-grid': 'The hero is a hairline grid with mono spec labels and one geometric mark built from the logo.',
}

/** The generation-prompt block for a direction. Replaces the generic palette brief + layout seed. */
export function renderDirectionBrief(dir: Direction): string {
  const pal = dir.palette
  const lines = TOKEN_ORDER.filter(k => pal.tokens[k]).map(k => `  --${k}: ${pal.tokens[k]};`).join('\n')
  const f = dir.fonts
  const dark = pal.mode === 'dark'
    ? '\nThis is a DARK direction — add className="dark" to the root element and keep that base.'
    : ''
  const anchors = dir.anchors.map(a => `${a.site} (${a.note})`).join('; ')
  return `\n\n━━━ DESIGN DIRECTION — ${dir.name.toUpperCase()} (${dir.id}) ━━━
${pal.vibe}.
Feel references (study the idea; never copy a brand's assets, copy, logo or layout): ${anchors}.${dark}

TOKENS — put these in src/index.css :root, then build with semantic classes only (bg-background, bg-primary, text-foreground, border-border…). Do not substitute a generic theme:
:root {
${lines}
  --radius: ${pal.radius};
  --font-sans: '${f.body}', ${FALLBACK};
  --font-display: '${f.display}', '${f.body}', ${FALLBACK};
  --font-mono: '${f.mono}', ui-monospace, monospace;
  --gradient-hero: ${pal.gradientHero};
}
Fonts load automatically from these names. Display = ${f.display} at weight ${f.displayWeight}, tracking ${f.displayTracking}. Body = ${f.body}. Mono (labels, numbers, captions) = ${f.mono}.

OWNED IDEA (write it as a code comment at the top of src/App.tsx, then build to it): "In this ⟨product⟩, ⟨one thing only this business has — an object, ritual, place, number⟩ becomes ⟨a visual device⟩." It must fail for the nearest competitor. List 6–8 things only this business has first, then pick the strongest.

COMPOSITION: ${dir.composition}
HERO MEDIUM: ${HERO_MEDIA_LINE[dir.rules.heroMedia] ?? ''}
SIGNATURE MOVES (each must be visible in the first screen or the idea is a costume):
${dir.moves.map(m => `- ${m}`).join('\n')}
MOTION: ${dir.motion}
IMAGES: ${dir.imageBrief}
IMAGE DIRECTIVES MUST BE LITERAL: write every {{wyber-image: full prompt | ratio}} in full, as a plain string, inside the attribute or data object that uses it (e.g. image: '{{wyber-image: black and white portrait of … | 1:1}}'). NEVER build a directive with a template literal, a variable, a prop or a .map() — the platform reads directives from the source text and cannot resolve interpolation, so the image would break.

HARD RULES FOR THIS DIRECTION (these override the generic kit rules):
- ${dir.rules.glow ? 'Glow/aurora effects are allowed only as described above.' : 'NO glow or ambient-light effects: do not use AuroraBackground, MeshGradient, StarField, GlowOrbsField, GlowOrbCard, LiquidBlob, CursorGlow, CursorFollowBlob, HolographicCard, SpotlightSection or DottedSpotlight.'}
- Gradient budget: ${dir.rules.gradientBudget === 0 ? 'ZERO gradients anywhere' : `at most ${dir.rules.gradientBudget} on the whole page`}.
- The hero headline is at least ${dir.rules.displayRatio}× the body text size.
- ${dir.rules.tintedInk ? 'Ink is the tinted foreground token. Never #000, text-black or bg-black.' : 'Use the foreground token for text; no literal colours.'}
- ONE signal colour (--primary) on interactive elements and one small detail per section. Do not introduce other saturated hues.
- Do NOT wrap every section in Reveal/Stagger. Use the motion described above, nothing more.
- INVENTED FACTS ARE PLACEHOLDERS: names, credentials, years in practice, prices, statistics, awards, testimonials, case studies and before/after results that the user did not supply must be clearly marked for the owner to replace (a visible "sample" label or a // PLACEHOLDER comment). Generated photos are illustrations, never real patients, customers, projects or results: do not call them "real cases", "verified" or "certified" and do not present a generated face as a named real person.
- No emoji as icons, no purple/indigo/violet anywhere unless it is this direction's primary, no stock grey-card grids.
NOT FOR: ${dir.notFor}
WATCH OUT: ${dir.pitfall}`
}
