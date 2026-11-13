// Unslop rules for generated web apps: what to tell the model, and what to flag in the code it wrote.
//
// Adapted from "unslop" by Damir Sokolovsky (@heydamir), https://github.com/heydamir/unslop (our fork: Wyberai/unslop),
// licensed CC BY 4.0. The signs of slop, the token values (neutral ramps, spacing, radius, type scale, motion) and the pass order are
// his; this file restates them for our generator and adds source checks. Keep this credit in copies and adaptations.
// Changes made: converted ramps from hex to the HSL channel tokens our builds use, dropped the screenshot/story/visual-generation parts,
// and kept only what applies to app screens (dashboards and tools).
//
// Off with the launch-ready flag (see launch-ready.ts): this block is appended after the launch-ready contract.

export const UNSLOP_ATTRIBUTION = 'Based on unslop by Damir Sokolovsky (@heydamir), CC BY 4.0, https://github.com/heydamir/unslop'

export const UNSLOP_WEBAPP_RULES = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UNSLOP — DESIGN CRAFT FOR APP SCREENS (OVERRIDES THE "AUGUST 2026" EFFECTS AND ANY EARLIER VISUAL RULE THAT CONFLICTS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
(Based on unslop by Damir Sokolovsky, CC BY 4.0, github.com/heydamir/unslop.) Slop spreads color and effects over the chrome. Craft keeps the chrome quiet and puts the richness into one or two moments of real content. For a web app (a tool people use all day) these rules replace the grain, mesh orbs, glow shadows, gradient borders, kinetic hero, parallax, magnetic buttons, shimmer headings, uppercase mono microlabels and "sparkline in every KPI card" instructions above. Where a rule above and a rule here disagree, this block wins.

US1 DIRECTION FIRST: before any code, write five short lines in a [progress:] line, derived from what the product does and for whom: Product (one plain sentence); Character (two or three concrete words like "calm, exact, a little warm"; never clean, modern, sleek, minimal, premium); World (the place or material it belongs to, which sets the neutral tint and the accent); Moments (the one or two places that get rich color or detail: a chart whose colors each mean a series, a rendered receipt, a status that feels alive); Signature (one small detail only this product would have, used consistently).

US2 COLOR: one tinted neutral ramp and ONE accent. Three text roles (primary, secondary, muted) from the same ramp. Accent covers a few percent of the screen: the primary action, the selection, one key figure. No hue-to-hue gradients, no gradient text, no glows or colored shadows, no blurred color blobs, no glass cards, no neon borders. Hairlines are the text color at 8% opacity. Depth comes from surface steps (page, card, raised) and, on light themes, shadows no stronger than 0 1px 2px rgba(0,0,0,0.05) or 0 8px 24px rgba(0,0,0,0.06) for floating things. Text on the accent reaches 4.5:1.
  Starting ramps as HSL channels (use the tint that matches the world; values are starting points, not a house style):
  graphite light: --background 0 0% 98%; --card 0 0% 100%; --muted 240 5% 96%; --foreground 0 0% 9%; --muted-foreground 0 0% 45%. graphite dark: --background 240 2% 8%; --card 240 4% 10%; --muted 240 3% 14%; --foreground 0 0% 93%; --muted-foreground 240 3% 53%.
  warm light (paper, food, craft, people): --background 40 36% 95%; --card 40 60% 98%; --muted 37 33% 91%; --foreground 33 17% 10%; --muted-foreground 34 9% 44%. warm dark: --background 40 7% 8%; --card 30 8% 10%; --muted 36 7% 14%; --foreground 39 35% 90%; --muted-foreground 38 6% 51%.
  ink light (technical, water, night): --background 216 33% 97%; --card 0 0% 100%; --muted 218 27% 94%; --foreground 221 39% 11%; --muted-foreground 221 12% 47%. ink dark: --background 227 29% 6%; --card 224 24% 9%; --muted 223 21% 13%; --foreground 223 26% 95%; --muted-foreground 223 12% 53%.
  Accent from the world, not from habit: warm worlds suit amber, coral or ember orange; cool worlds cobalt, teal or sky blue; natural worlds moss or sage. Avoid the purple-to-blue family unless the brand really is purple. Success 142 71% 33% on light, 152 49% 53% on dark; destructive 0 72% 51% on light, 359 75% 59% on dark.

US3 TYPE: one interface family (Switzer or General Sans from the preloaded set) plus at most one partner: a mono for figures and meta, or a display serif for a large page headline only. Weights 400 and 500, 600 at most for rare emphasis; never 700 to 900 headings, never gradient text, never italic for emphasis. Sentence case everywhere: no uppercase tracked labels like NAVIGATION. Sizes from this scale only: 12/16 labels and meta, 13-14/20 captions, 14-15/20-22 body and nav, 28-32 card figures (500, tabular-nums), 28-36 page title. No negative letter spacing under 16px. Numbers use tabular-nums and ONE format across the screen.

US4 SPACING AND SHAPE: spacing only from 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 (no mt-[13px] style values). Row heights 36 default, 40-44 touch. Same-type siblings share one height, one gap, one padding. Radius by size, not everything a pill: small controls 4-6, rows and inputs 8-10, cards 12-16, panels 14-20; an inner radius is the outer radius minus the padding, never below 4. App shell: sidebar 240-280 wide, content fluid and capped near 1440, page header 56-64 tall; never shrink an app into a narrow centered column on desktop.

US5 ICONS: one set (lucide), 16 or 18px, stroke 1.5, the muted or secondary text color, same icon-box width in every row, 8-10px gap to the label. NO emoji anywhere in the interface (no 🏠 📥 ✨ 🔥 ⚠️ in labels, pills, counts, buttons or empty states). Status that needs color gets a small dot. No sparkle for anything AI.

US6 COPY: titles name the page or period ("October 2026", "Items"), never a greeting like "Welcome back, Asha!". No exclamation marks in interface text. Short labels ("Search", not "Search anything..."). A change says what it compares to ("+12% vs last month"). Labels, buttons and captions end without a period. No hype words (supercharge, seamless, unlock, magic, revolutionize, empower, elevate, streamline) and no "AI-powered" unless the feature really uses AI. Mock data looks real (plausible names and numbers), never [X] or 123,456.

US7 COMPONENTS AND DATA: stat cards are a label, a figure and a change with what it compares to; no sparklines, mini bars or decorative icons inside them. ONE main chart is clearly the biggest thing on the screen (about two thirds of the width, 280-360 tall); anything beside it is a ranked list or short table, never a second chart of the same size. One accent per chart: the thing that matters gets the accent, the rest sit in neutral steps; several hues only when series must be told apart. Chart type follows the data: trend is a line, comparison is bars, share is a stacked bar or a list with bars, a goal is a progress bar. Counts, plans and shortcuts are quiet mono text or keycaps, never glowing pills. No "PRO", "New" or "Beta" badges. The active nav item is a small surface step with a hairline, not a gradient. Hover and focus states exist and stay inside the palette, with a visible focus ring.

US8 MOTION: transition only color, background, border, opacity and transform, and name them (transition-colors, transition-[transform,opacity]); never transition-all. No animate-pulse or animate-ping on things that are not live (loading skeletons may pulse), no hover:scale on cards, no bounce or overshoot, no parallax, no floating loops, no shimmer on headings. One easing curve everywhere: cubic-bezier(0.22, 1, 0.36, 1); hover and press 120-180ms, menus 160-220ms, entrances 300-500ms with a 40-60ms stagger of at most six items, rise 6-12px. At most one entrance on load. Never animate width, height, top, left or margins. Honour prefers-reduced-motion.

US9 NO REPLACEMENT DECORATION: do not swap one trend for another (no glass, grain, noise, neon or bento grids to fill the space). Dashboards and tools rarely need generated images: their moments come from the product's own content.

US10 TEMPLATE CHECK before the "Built:" line: if you swapped this product's name for another product's, would the screen still fit? If yes, push the direction harder in the copy, the data and the signature detail. Confirm silently: no hue gradients, glows or emoji; one ramp, three text roles, one accent; spacing on the scale; weights 400 to 600; sentence case; no exclamation marks; tabular numbers; one icon set; one easing curve.
`

// ── Source check ─────────────────────────────────────────────────────────────

type FileVal = { content?: string } | string | undefined
const contentOf = (v: FileVal): string => (typeof v === 'string' ? v : (v?.content ?? ''))

export interface SlopIssue { id: string; label: string; count: number; sample: string; fix: string }
export interface SlopResult { score: number; issues: SlopIssue[] }

interface Rule {
  id: string
  label: string
  /** Weight in the score when present (capped by count). */
  weight: number
  fix: string
  find: (code: string) => string[]
}

const EMOJI = /[\u{1F300}-\u{1FAFF}✨⚠⭐❤\u{1F000}-\u{1F2FF}]/gu
const matches = (re: RegExp, s: string): string[] => {
  const out: string[] = []
  re.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(s)) !== null) { out.push(m[0].slice(0, 80)); if (m[0].length === 0) re.lastIndex++ }
  return out
}

const RULES: Rule[] = [
  { id: 'gradient-text', label: 'Gradient or transparent heading text', weight: 6,
    fix: 'Use a solid text color from the ramp; remove bg-clip-text and text-transparent gradients.',
    find: c => matches(/bg-clip-text|text-transparent/g, c) },
  { id: 'hue-gradient', label: 'Hue-to-hue gradients on surfaces', weight: 6,
    fix: 'Use one neutral surface and one accent used sparingly; remove from-/to- hue gradients and gradient CSS variables on cards, buttons and backgrounds.',
    find: c => matches(/\b(?:from|via|to)-(?:purple|violet|indigo|fuchsia|pink|rose|sky|cyan|blue|primary|accent)(?:-\d+)?(?:\/\d+)?\b|--gradient-[a-z-]+\s*:/g, c) },
  { id: 'glow', label: 'Glows and colored shadows', weight: 6,
    fix: 'Remove glows and colored shadows; get depth from surface steps and 8% hairlines.',
    find: c => matches(/shadow-\[0_0_\d+px|--shadow-glow|drop-shadow-\[|shadow-(?:primary|accent|purple|violet|indigo|blue|pink)\b|box-shadow:[^;]*0 0 \d+px/g, c) },
  { id: 'blobs', label: 'Blurred blobs and orbs behind content', weight: 5,
    fix: 'Remove blurred color blobs, mesh orbs and radial washes; use a plain background.',
    find: c => matches(/\bblur-(?:2xl|3xl)\b|\bblur-\[\d{2,}px\]|mesh-orb|radial-gradient\(/g, c) },
  { id: 'grain-glass', label: 'Grain, noise or glass effects', weight: 3,
    fix: 'Remove grain, noise and glass (backdrop-blur cards); use a plain raised surface with a hairline.',
    find: c => matches(/\bgrain\b|feTurbulence|backdrop-blur-(?:md|lg|xl|2xl)|noise-overlay/g, c) },
  { id: 'emoji', label: 'Emoji in the interface', weight: 8,
    fix: 'Replace every emoji with a lucide icon (16 or 18px, stroke 1.5, muted color) or nothing.',
    find: c => matches(EMOJI, c) },
  { id: 'uppercase-labels', label: 'Uppercase tracked labels', weight: 4,
    fix: 'Use sentence-case labels with normal tracking; remove uppercase with tracking-wide/wider/widest.',
    find: c => matches(/uppercase[^"'`\n]{0,60}tracking-(?:wide|wider|widest)|tracking-(?:wide|wider|widest)[^"'`\n]{0,60}uppercase/g, c) },
  { id: 'heavy-type', label: 'Weight 800 or 900 headings', weight: 4,
    fix: 'Use weights 400 to 600 and let size and color carry the hierarchy.',
    find: c => matches(/\bfont-(?:extrabold|black)\b|font-weight:\s*(?:800|900)/g, c) },
  { id: 'odd-spacing', label: 'Arbitrary spacing off the 4px scale', weight: 3,
    fix: 'Use steps on the 4px scale (4, 8, 12, 16, 20, 24, 32, 40, 48, 64) instead of values like mt-[13px].',
    find: c => matches(/\b(?:m|p|mt|mb|ml|mr|mx|my|px|py|pt|pb|pl|pr|gap|h|w|top|left)-\[(\d+)px\]/g, c).filter(s => { const n = Number((s.match(/\[(\d+)px\]/) ?? [])[1]); return n > 0 && n < 200 && n % 4 !== 0 }) },
  { id: 'looping-motion', label: 'Looping or bouncy motion', weight: 4,
    fix: 'Remove animate-pulse/ping on non-live things, bounce, hover:scale on cards and floating loops. Hover is a color or surface step; press is a tiny scale down.',
    find: c => c.split('\n').filter(l => /animate-ping|animate-bounce|animate-float|hover:scale-1[0-9]{2}|hover:-translate-y/.test(l) || (/animate-pulse/.test(l) && !/skeleton|loading|live|status/i.test(l))).map(l => l.trim().slice(0, 80)) },
  { id: 'transition-all', label: 'transition-all', weight: 3,
    fix: 'Name the transitioned properties: transition-colors or transition-[transform,opacity].',
    find: c => matches(/\btransition-all\b|transition:\s*all\b/g, c) },
  { id: 'exclamation', label: 'Exclamation marks in interface text', weight: 4,
    fix: 'Write plain statements; remove exclamation marks from labels, toasts and headings.',
    find: c => [...matches(/(["'`])[^"'`\n<>]{3,90}[A-Za-z0-9)]!\1/g, c), ...matches(/>[^<>{}\n]{3,90}[A-Za-z0-9)]!\s*</g, c)] },
  { id: 'greeting', label: 'Greeting headline', weight: 3,
    fix: 'Title the page by its context (the page name or the period), not "Welcome back".',
    find: c => matches(/Welcome back[,!]?/gi, c) },
  { id: 'hype', label: 'Hype words', weight: 4,
    fix: 'Say what the thing does; remove supercharge, seamless, unlock, magic, revolutionize, empower, elevate, streamline.',
    find: c => matches(/\b(?:supercharge|seamless(?:ly)?|unlock|revolutioniz\w*|game-?chang\w*|magic(?:al)?|cutting-edge|empower\w*|elevate|streamline)\b/gi, c.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '')) },
  { id: 'sparkline-cards', label: 'Sparklines inside stat cards', weight: 3,
    fix: 'Stat cards are a label, a figure and a change with what it compares to; remove sparklines and mini charts.',
    find: c => matches(/sparkline|<Sparkline|KpiCard[^\n]{0,40}trend/gi, c) },
  { id: 'pill-everywhere', label: 'Everything a full pill', weight: 2,
    fix: 'Give radius by size: controls 8-10, cards 12-16; keep rounded-full for avatars and dots.',
    find: c => { const n = (c.match(/rounded-full/g) ?? []).length; return n > 12 ? [`${n} x rounded-full`] : [] } },
]

export function scanSlopSource(files: Record<string, FileVal>): SlopResult {
  const code = Object.entries(files || {})
    .filter(([p]) => /\.(tsx?|jsx?|css)$/.test(p) && !/wyber-ui|wyber-grow|node_modules/.test(p))
    .map(([, v]) => contentOf(v))
    .join('\n')
  const issues: SlopIssue[] = []
  let penalty = 0
  for (const r of RULES) {
    const found = r.find(code)
    if (found.length === 0) continue
    issues.push({ id: r.id, label: r.label, count: found.length, sample: found[0], fix: r.fix })
    penalty += Math.min(r.weight * 2, r.weight + Math.min(found.length - 1, 4))
  }
  return { score: Math.max(0, 100 - penalty), issues }
}

/** Failing rules as fix prompts for the free fix lane. Highest-impact first, at most three per pass. */
export function slopIssues(files: Record<string, FileVal>): { kind: 'launch-ready'; detail: string; fixPrompt: string }[] {
  const weights = new Map(RULES.map(r => [r.id, r.weight]))
  return scanSlopSource(files).issues
    .sort((a, b) => (weights.get(b.id) ?? 0) - (weights.get(a.id) ?? 0))
    .slice(0, 3)
    .map(i => ({
      kind: 'launch-ready' as const,
      detail: `Design: ${i.label}`,
      fixPrompt: `DESIGN CRAFT item: ${i.label} (${i.count} found, for example "${i.sample.replace(/"/g, "'")}"). ${i.fix} Change only what is needed and keep every feature working.`,
    }))
}
