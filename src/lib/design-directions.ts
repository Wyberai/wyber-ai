// Design directions — the "deal, don't default" layer for web builds.
//
// Replaces "pick a palette by keyword, then compose kit components" with a library of researched
// directions, each anchored in real sites that were measured on 10 Nov 2026 (see
// docs/web-design-direction-research.md for the evidence, caveats and sources). The structure follows
// massipetro/app-ui-slopless (MIT) — a direction is a whole design idea (ground, ink, type, hero medium,
// signature moves, motion, image brief, lintable rules), not just a palette.
//
// Anchors are FEEL references. Colours are rounded from measured values; nothing here copies a brand's
// assets, copy or layout. Everything is pure data + helpers: no network, no DOM, no model calls.

import { contrastRatio } from './color-contrast'
import type { Palette } from './design-palettes'

export type DirectionGroup =
  | 'editorial' | 'type-led' | 'dark' | 'light-tech' | 'brand-block' | 'physical' | 'human' | 'tool'

export type HeroMedia =
  | 'photo' | 'video' | 'illustration' | 'type' | 'product-ui' | 'gradient-field' | 'line-art' | 'cutouts' | 'spec-grid'

export type Surface = 'website' | 'app'
export type AnchorStatus = 'SOTD' | 'SOTM' | 'HM' | 'leader'

export interface Anchor { site: string; status: AnchorStatus; note: string }

export interface DirectionRules {
  /** Allow the kit's glow/aurora/orb/mesh/spotlight effects. Almost always false. */
  glow: boolean
  /** Max gradient utilities / CSS gradients on the whole build (0 = none). */
  gradientBudget: number
  heroMedia: HeroMedia
  /** Minimum display-to-body size ratio for the hero headline. */
  displayRatio: number
  /** Ink must be a tinted near-black, never #000 / text-black. */
  tintedInk: boolean
}

export interface Direction {
  id: string
  name: string
  group: DirectionGroup
  surfaces: Surface[]
  anchors: Anchor[]
  /** Reuses the Palette shape so existing token plumbing works unchanged. */
  palette: Palette
  fonts: { display: string; body: string; mono: string; displayWeight: number; displayTracking: string }
  composition: string
  moves: string[]
  motion: string
  imageBrief: string
  rules: DirectionRules
  fits: string[]
  notFor: string
  pitfall: string
  /** Works for almost any business: preferred as a filler option when few directions fit the prompt. */
  generalist: boolean
  /** Neutral enough to be the default for an APP (webapp/saas) when the prompt gives no signal. */
  appDefault: boolean
}

// ── colour helpers (HSL channel strings, the format every token uses) ───────────────────────────────
type HSL = [number, number, number]
const css = (c: HSL) => `${c[0]} ${c[1]}% ${c[2]}%`

export function hslToHex([h, sat, l]: HSL): string {
  const s = sat / 100
  const L = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(L, 1 - L)
  const f = (n: number) => L - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const to = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0')
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`
}
const ratio = (a: HSL, b: HSL) => contrastRatio(hslToHex(a), hslToHex(b))
const clampL = (n: number) => Math.max(0, Math.min(100, n))
const WHITE: HSL = [0, 0, 100]
const BLACKISH: HSL = [0, 0, 6]

interface TokenSpec {
  bg: HSL; fg: HSL; primary: HSL
  primaryFg?: HSL; card?: HSL; muted?: HSL; mutedFg?: HSL; accent?: HSL; accentFg?: HSL
  border?: HSL; destructive?: HSL
}

function buildTokens(o: TokenSpec): Record<string, string> {
  const light = o.bg[2] >= 50
  const card = o.card ?? ([o.bg[0], o.bg[1], clampL(o.bg[2] + (light ? -1.5 : 3))] as HSL)
  const muted = o.muted ?? ([o.bg[0], Math.min(100, o.bg[1]), clampL(o.bg[2] + (light ? -6 : 7))] as HSL)
  const border = o.border ?? ([muted[0], muted[1], clampL(muted[2] + (light ? -6 : 6))] as HSL)
  let mutedFg = o.mutedFg
  if (!mutedFg) {
    // largest step toward the background that still reads (>= 4.6:1) on both bg and muted
    for (let t = 0.4; t >= 0; t -= 0.05) {
      const cand: HSL = [o.fg[0], o.fg[1], clampL(o.fg[2] + (o.bg[2] - o.fg[2]) * t)]
      if (ratio(cand, o.bg) >= 4.6 && ratio(cand, muted) >= 4.6) { mutedFg = cand; break }
    }
    mutedFg = mutedFg ?? o.fg
  }
  const options: HSL[] = [o.fg, o.bg, WHITE, BLACKISH]
  const primaryFg = o.primaryFg ?? options.reduce((best, c) => (ratio(c, o.primary) > ratio(best, o.primary) ? c : best), options[0])
  const destructive = o.destructive ?? ([0, 72, light ? 42 : 58] as HSL)
  const destructiveFg = ratio(WHITE, destructive) >= 4.5 ? WHITE : BLACKISH
  const accent = o.accent ?? muted
  return {
    background: css(o.bg), foreground: css(o.fg),
    card: css(card), 'card-foreground': css(o.fg),
    popover: css(card), 'popover-foreground': css(o.fg),
    primary: css(o.primary), 'primary-foreground': css(primaryFg),
    secondary: css(muted), 'secondary-foreground': css(o.fg),
    muted: css(muted), 'muted-foreground': css(mutedFg),
    accent: css(accent), 'accent-foreground': css(o.accentFg ?? o.fg),
    destructive: css(destructive), 'destructive-foreground': css(destructiveFg),
    border: css(border), input: css(border), ring: css(o.primary),
  }
}

interface DirSpec extends TokenSpec {
  id: string; name: string; group: DirectionGroup; surfaces?: Surface[]
  anchors: Anchor[]
  vibe: string
  radius: string
  fonts: Direction['fonts']
  gradientHero?: string
  fits: string[]
  composition: string; moves: string[]; motion: string; imageBrief: string
  rules: DirectionRules
  notFor: string; pitfall: string
  generalist?: boolean
  appDefault?: boolean
}

function dir(s: DirSpec): Direction {
  const tokens = buildTokens(s)
  return {
    id: s.id, name: s.name, group: s.group, surfaces: s.surfaces ?? ['website'],
    anchors: s.anchors,
    palette: {
      id: s.id, label: s.name, vibe: s.vibe, mode: s.bg[2] >= 50 ? 'light' : 'dark',
      fontSans: s.fonts.body, fontDisplay: s.fonts.display, radius: s.radius, tokens,
      gradientHero: s.gradientHero ?? 'none', domains: s.fits,
    },
    fonts: s.fonts, composition: s.composition, moves: s.moves, motion: s.motion,
    imageBrief: s.imageBrief, rules: s.rules, fits: s.fits, notFor: s.notFor, pitfall: s.pitfall,
    generalist: s.generalist ?? false,
    appDefault: s.appDefault ?? false,
  }
}

const A = (site: string, status: AnchorStatus, note: string): Anchor => ({ site, status, note })

// ── the library ─────────────────────────────────────────────────────────────────────────────────────
export const DIRECTIONS: Direction[] = [
  // ───────────── editorial / brand-world
  dir({
    generalist: true,
    appDefault: true,
    id: 'ed-brand-world', name: 'Brand world', group: 'editorial', surfaces: ['website', 'app'],
    anchors: [A('aesop.com', 'leader', 'warm off-white ground, one text family, 71 images, 3 gradients'), A('en.manayerbamate.com', 'SOTD', 'cream ground, ink near-black, coral + peach, 0 gradients, 102 images')],
    vibe: 'Calm, tactile brand world — warm paper ground, one text family, photography does the talking',
    bg: [48, 70, 96], fg: [24, 14, 12], primary: [10, 80, 55], accent: [38, 90, 82],
    radius: '0.25rem',
    fonts: { display: 'Newsreader', body: 'Hanken Grotesk', mono: 'DM Mono', displayWeight: 400, displayTracking: '-0.01em' },
    fits: ['retail', 'boutique', 'shop', 'store', 'cosmetic', 'skincare', 'candle', 'tea', 'coffee', 'artisan', 'handmade', 'ceramic', 'home', 'lifestyle', 'organic', 'brand'],
    composition: 'Full-width image-led sections on a warm paper ground. A quiet top bar (logo left, three links right). Hero = one large brand photograph with a short serif line under or over it. Then alternating image/text bands with generous 120px+ vertical rhythm, a product grid with plenty of air, and a restrained footer. No cards-with-shadows, no icon rows.',
    moves: ['One serif display face used big and calm (clamp 40–96px, weight 400), body in the grotesk', 'Photography occupies at least 60% of the page height', 'Accent colour appears only on the primary action and one small detail per section'],
    motion: 'Almost none: slow image fade-in, a gentle 8px rise on text. Never parallax on text. No looping effects.',
    imageBrief: 'Natural-light product and place photography, shallow depth, warm neutrals, real textures (paper, linen, wood, steam). Hands in frame. No glossy 3D renders, no gradients, no stock-office scenes.',
    rules: { glow: false, gradientBudget: 0, heroMedia: 'photo', displayRatio: 4, tintedInk: true },
    notFor: 'Data-heavy dashboards; brands with no photographable product.',
    pitfall: 'Turns into a generic cream landing page when the imagery is weak — if there is no real photography, pick a type-led direction instead.',
  }),
  dir({
    generalist: true,
    id: 'ty-poster', name: 'Giant type poster', group: 'type-led',
    anchors: [A('en.manayerbamate.com', 'SOTD', 'section word at 237px weight 300, one typeface (Neue Montreal)'), A('pangrampangram.com', 'SOTD', 'one typeface, #fafafa, black ink, one red-orange signal')],
    vibe: 'Poster-scale light type on warm cream, one word per section, one signal colour',
    bg: [42, 75, 94], fg: [20, 12, 8], primary: [12, 90, 55], radius: '0rem',
    fonts: { display: 'Inter Tight', body: 'Inter Tight', mono: 'DM Mono', displayWeight: 300, displayTracking: '-0.03em' },
    fits: ['studio', 'agency', 'creative', 'brand', 'design', 'event', 'festival', 'launch', 'collection', 'd2c', 'drink', 'beverage', 'snack'],
    composition: 'Each section is one huge word (clamp 120–240px, weight 300, tracking -0.03em) with one image or short line beside it. Sections separated by hairlines, not cards. Nav is a single row of small text. Footer repeats the biggest word.',
    moves: ['Display 160–240px at weight 300 against 16px body (ratio >= 10)', 'Exactly one signal colour, used on at most 5% of the page', 'Hairline dividers (1px) instead of boxes'],
    motion: 'Words slide up 24px on entry (one easing, 600ms). Nothing loops. Reduced-motion: no movement.',
    imageBrief: 'Bold single-subject photographs, strong colour blocking, hard light. One image per section, full-bleed or half-width.',
    rules: { glow: false, gradientBudget: 0, heroMedia: 'type', displayRatio: 8, tintedInk: true },
    notFor: 'Long copy-heavy pages; anything needing dense forms.',
    pitfall: 'Weight 300 at small sizes is unreadable — keep light weight for display only.',
  }),
  dir({
    generalist: true,
    appDefault: true,
    id: 'mn-signal', name: 'Single-signal grid', group: 'type-led', surfaces: ['website', 'app'],
    anchors: [A('pangrampangram.com', 'SOTD', '#fafafa ground, black ink, signal rgb(255,47,0), 0 gradients, 37 images, art-directed image cards')],
    vibe: 'Near-white, black, ONE signal red-orange; every image card has its own mood',
    bg: [0, 0, 98], fg: [0, 0, 4], primary: [11, 100, 50], radius: '0.5rem',
    fonts: { display: 'Hanken Grotesk', body: 'Hanken Grotesk', mono: 'DM Mono', displayWeight: 600, displayTracking: '-0.02em' },
    fits: ['portfolio', 'catalogue', 'catalog', 'foundry', 'typeface', 'font', 'gallery', 'photography', 'products', 'tools', 'plugin', 'software'],
    composition: 'A small sticky top bar, then a vertical stack of large rounded image cards (each full-width, ~70vh) with a short headline and two buttons centred over each. Cards differ completely in colour and subject; the UI chrome stays the same.',
    moves: ['Signal colour only on tags and the primary button', 'Each card its own art direction; chrome never changes', 'Black is a tinted near-black'],
    motion: 'Cards scale from 0.98 to 1 on entry; nothing else moves.',
    imageBrief: 'Each image a distinct, finished artwork (illustration, photo, type specimen). Consistent crop, wildly different content.',
    rules: { glow: false, gradientBudget: 0, heroMedia: 'photo', displayRatio: 4, tintedInk: true },
    notFor: 'Brands without a strong visual library.',
    pitfall: 'Identical card art makes it a generic grid — every card needs its own mood.',
  }),
  // ───────────── dark
  dir({
    generalist: true,
    id: 'dk-studio', name: 'Dark typographic studio', group: 'dark',
    anchors: [A('synchronized.studio', 'SOTD', '#151515 ground, 123px weight-300 type, one pale green accent, one canvas micro-animation')],
    vibe: 'Charcoal ground, oversized light type, one pale accent, a single quiet animation',
    bg: [0, 0, 8], fg: [0, 0, 96], primary: [82, 47, 85], radius: '0.25rem',
    fonts: { display: 'Inter Tight', body: 'Inter Tight', mono: 'DM Mono', displayWeight: 300, displayTracking: '-0.03em' },
    fits: ['agency', 'studio', 'creator', 'filmmaker', 'photographer', 'portfolio', 'production', 'music', 'artist', 'producer', 'freelance', 'freelancer', 'personal website', 'personal site', 'videographer', 'illustrator'],
    composition: 'Full-viewport sections on charcoal. One huge light word or sentence per screen, small mono labels in the corners, a numbered project index. Case studies open as full-bleed images.',
    moves: ['Display 96–160px at weight 300, tracking -0.03em', 'Corner micro-labels in mono (index, year, location)', 'One animated element on the whole site (a line, a glyph, a cursor trail) — not many'],
    motion: 'Slow (700–900ms) ease-out reveals; a single ambient loop at most. No glow.',
    imageBrief: 'Dark, high-contrast editorial stills; muted grading; one subject per frame.',
    rules: { glow: false, gradientBudget: 1, heroMedia: 'type', displayRatio: 8, tintedInk: false },
    notFor: 'Consumer retail; low-literacy audiences.',
    pitfall: 'Easily becomes "dark mode landing page" — keep type scale extreme and effects absent.',
  }),
  dir({
    id: 'dk-instrument', name: 'Instrument dark', group: 'dark', surfaces: ['website', 'app'],
    anchors: [A('linear.app', 'leader', 'rgb(8,9,10) ground, hue-free grey ladder, Inter + Berkeley Mono, 56px/510, tracking -1.2px'), A('raycast.com', 'leader', 'rgb(7,8,10), white + alpha ladder'), A('resend.com', 'leader', 'black, greys, mono body')],
    vibe: 'Near-black instrument panel: hue-free greys, mono details, the product UI is the hero — no colour',
    bg: [210, 11, 4], fg: [180, 7, 97], primary: [180, 7, 97], primaryFg: [210, 11, 4], radius: '0.5rem',
    fonts: { display: 'Inter Tight', body: 'Inter Tight', mono: 'Geist Mono', displayWeight: 500, displayTracking: '-0.025em' },
    fits: ['saas', 'developer', 'api', 'no-code', 'low-code', 'form builder', 'startup', 'devtool', 'cli', 'platform', 'workflow', 'automation', 'analytics', 'dashboard', 'infrastructure', 'b2b', 'engineering', 'issue', 'project management'],
    composition: 'Dark ground, centred headline (56–72px, weight 500, tight tracking), a short grey subline, one white pill button, then a large product-UI screenshot or live component as the hero. Sections are plain: headline left, product detail right, thin 1px borders, mono labels.',
    moves: ['Colour ladder is greys only; the single "accent" is white', 'Mono for numbers, shortcuts and labels', 'Product UI shown real-size, cropped at the edge'],
    motion: 'Subtle: 200–300ms fades, hover border brightening. No ambient animation.',
    imageBrief: 'Real product screenshots (use the app\'s own UI components), never abstract 3D art, never glowing orbs.',
    rules: { glow: false, gradientBudget: 3, heroMedia: 'product-ui', displayRatio: 3.5, tintedInk: false },
    notFor: 'Consumer, food, wellness, local services, schools, clinics, shops and any software for non-technical staff (CRM, inventory, billing, school or clinic management).',
    pitfall: 'This look is the origin of generic "dark + neon glow". The restraint IS the design — no hues, no glow, no gradient meshes.',
  }),
  dir({
    id: 'mono-dev', name: 'Mono-body developer', group: 'dark', surfaces: ['website', 'app'],
    anchors: [A('resend.com', 'leader', 'Commit Mono body, Inter, large display, #000 ground, 96px headline')],
    vibe: 'Black page, monospace body, giant display, one amber signal',
    bg: [0, 0, 3], fg: [0, 0, 94], primary: [40, 95, 58], radius: '0.375rem',
    fonts: { display: 'Inter Tight', body: 'IBM Plex Mono', mono: 'IBM Plex Mono', displayWeight: 400, displayTracking: '-0.03em' },
    fits: ['api', 'sdk', 'email', 'developer', 'open source', 'cli', 'infra', 'docs', 'webhook', 'backend', 'database', 'devops'],
    composition: 'Black ground, 96px headline, monospace body copy, code blocks as first-class design objects (real syntax-highlighted snippets), narrow max-width columns, a changelog-style footer.',
    moves: ['Body text set in a monospace face', 'Code blocks double as illustrations', 'Amber for the primary button only'],
    motion: 'Typed-in code lines at most once; otherwise static.',
    imageBrief: 'No photography. Code, terminal output and diagrams only.',
    rules: { glow: false, gradientBudget: 1, heroMedia: 'product-ui', displayRatio: 5, tintedInk: false },
    notFor: 'Anything consumer-facing or non-technical.',
    pitfall: 'Monospace body is tiring over long copy — keep paragraphs short.',
  }),
  dir({
    id: 'tn-cultural', name: 'Tinted dark cultural', group: 'dark',
    anchors: [A('franshalsmuseum.nl', 'leader', 'rgb(0,19,23) teal-black, peach rgb(254,205,140), Rubik 700 caps, rounded offset cards, video hero')],
    vibe: 'Deep teal-black with warm peach, bold caps, rounded offset cards over a video hero',
    bg: [190, 100, 5], fg: [0, 0, 98], primary: [34, 98, 77], radius: '1.25rem',
    fonts: { display: 'Rubik', body: 'Rubik', mono: 'DM Mono', displayWeight: 700, displayTracking: '0em' },
    fits: ['museum', 'gallery', 'theatre', 'theater', 'cinema', 'venue', 'festival', 'heritage', 'culture', 'concert', 'library', 'exhibition', 'tour'],
    composition: 'Full-bleed video or photo hero with a pill language switch and menu; below, rounded dark cards offset on a grid, one bold uppercase title per card, peach for actions.',
    moves: ['Uppercase bold titles', 'Cards offset on two columns with large radius', 'Peach only for actions and dates'],
    motion: 'Cards ease up 16px on entry. Hero video muted with a visible pause control.',
    imageBrief: 'Moody, warm-lit documentary photography with people in it; period or place details.',
    rules: { glow: false, gradientBudget: 3, heroMedia: 'video', displayRatio: 3, tintedInk: false },
    notFor: 'Fintech, SaaS.',
    pitfall: 'Needs real photography or video; without it the dark teal feels empty.',
  }),
  // ───────────── light tech
  dir({
    appDefault: true,
    id: 'lt-luxe-fintech', name: 'Light-weight luxe', group: 'light-tech', surfaces: ['website', 'app'],
    anchors: [A('stripe.com', 'leader', 'light display weight 300 at 56px, tracking -1.4px, navy ink rgb(6,27,49), ONE brand colour, Söhne')],
    vibe: 'Airy white, light-weight display type, navy ink, ONE brand colour',
    bg: [0, 0, 100], fg: [211, 70, 11], primary: [206, 88, 38], radius: '0.625rem',
    fonts: { display: 'Inter Tight', body: 'Inter Tight', mono: 'DM Mono', displayWeight: 300, displayTracking: '-0.03em' },
    fits: ['fintech', 'payments', 'banking', 'invoice', 'accounting', 'finance', 'insurance', 'b2b', 'enterprise', 'billing', 'treasury', 'lending'],
    composition: 'White ground, a 56–72px weight-300 headline in navy ink, one brand-colour button, then product UI in soft cards on a pale tint band. Numbers are large and tabular. Gradients only as one art-directed hero background, never per section.',
    moves: ['Headline weight 300, tracking -0.03em', 'Navy ink (not black), one brand colour for actions', 'Tabular figures and real-looking data'],
    motion: 'Quiet 250ms fades; number count-up on stat blocks only.',
    imageBrief: 'Product UI and abstract-but-precise geometry in the brand colour; no people stock photos.',
    rules: { glow: false, gradientBudget: 1, heroMedia: 'product-ui', displayRatio: 4, tintedInk: true },
    notFor: 'Playful consumer brands.',
    pitfall: 'Generic when the data in the UI mock is fake-looking — use specific, plausible numbers.',
  }),
  dir({
    appDefault: true,
    id: 'b2b-acid-mono', name: 'Acid mono B2B', group: 'light-tech', surfaces: ['website', 'app'],
    anchors: [A('ramp.com', 'leader', 'white ground, near-black ink, ONE acid yellow-lime CTA, Lausanne only, 64px/400, product UI hero, dotted grid')],
    vibe: 'White, near-black ink, ONE acid yellow-lime action colour, copy-led headline over product UI',
    bg: [0, 0, 100], fg: [220, 18, 6], primary: [62, 100, 58], primaryFg: [220, 18, 6], radius: '0.5rem',
    fonts: { display: 'Hanken Grotesk', body: 'Hanken Grotesk', mono: 'DM Mono', displayWeight: 500, displayTracking: '-0.02em' },
    fits: ['expense', 'spend', 'no-code', 'low-code', 'form builder', 'procurement', 'inventory', 'warehouse', 'stock', 'vendor', 'purchase order', 'gst', 'hr', 'payroll', 'crm', 'erp', 'operations', 'logistics', 'compliance', 'enterprise', 'b2b', 'manufacturing', 'supply chain'],
    composition: 'A witty one-line headline (64px), subline, a work-email field with one acid button, then a large product screenshot on a faint dotted-grid. Logos row, then plain feature bands with product crops.',
    moves: ['One acid action colour, nowhere else', 'Headline written as a confident sentence, not a slogan', 'Faint dotted grid texture instead of gradients'],
    motion: 'None beyond hover; product UI may play one 6s loop.',
    imageBrief: 'The product\'s own UI in real size; no stock.',
    rules: { glow: false, gradientBudget: 0, heroMedia: 'product-ui', displayRatio: 4, tintedInk: true },
    notFor: 'Wellness, hospitality, culture.',
    pitfall: 'Acid colour on large surfaces becomes garish — action only.',
  }),
  // ───────────── brand block
  dir({
    generalist: true,
    id: 'br-saturated', name: 'Saturated brand block', group: 'brand-block',
    anchors: [A('kodeclubs.com', 'SOTD', 'white ground, indigo rgb(28,34,140) + hot pink rgb(245,3,89), 160px extended wordmark')],
    vibe: 'White ground, a huge extended wordmark in one saturated brand colour, one hot accent',
    bg: [0, 0, 100], fg: [237, 67, 22], primary: [339, 98, 45], radius: '0.25rem',
    fonts: { display: 'Archivo Black', body: 'Hanken Grotesk', mono: 'DM Mono', displayWeight: 400, displayTracking: '-0.01em' },
    fits: ['club', 'gym', 'sports', 'academy', 'league', 'team', 'community', 'brand', 'consumer', 'kids'],
    composition: 'A giant wordmark centred on a white page in the brand colour, a hot-accent line under it, then bold blocks of the brand colour alternating with white. Photography used as cut-outs or full-bleed in blocks.',
    moves: ['Display 120–200px in the brand colour', 'Hot accent only on tiny labels and buttons', 'Ink is the brand colour, not black'],
    motion: 'A counter or wordmark reveal on load, nothing else.',
    imageBrief: 'Energetic, saturated action photography; cut-outs on flat colour.',
    rules: { glow: false, gradientBudget: 0, heroMedia: 'type', displayRatio: 8, tintedInk: true },
    notFor: 'Premium minimal brands.',
    pitfall: 'Two saturated hues fight — keep one as ink and one as a sliver.',
  }),
  dir({
    id: 'br-signal-ground', name: 'Signal-colour ground', group: 'brand-block',
    anchors: [A('phive.pt', 'SOTD', 'saturated yellow rgb(255,217,4) ground, black/white, 284px display, tracking -5.7px'), A('enerblock.net', 'SOTD', 'coral rgb(255,89,73) hero ground, near-black ink')],
    vibe: 'The whole page ground is ONE saturated colour; black ink; enormous tightly tracked display',
    bg: [51, 100, 51], fg: [0, 0, 6], primary: [0, 0, 6], primaryFg: [51, 100, 51], radius: '0rem',
    fonts: { display: 'Unbounded', body: 'Hanken Grotesk', mono: 'DM Mono', displayWeight: 600, displayTracking: '-0.04em' },
    fits: ['gym', 'fitness', 'club', 'sports', 'studio', 'event', 'construction', 'builder', 'hardware', 'engineering', 'industrial', 'manufacturing'],
    composition: 'The page background is the signal colour. Black ink, white as the only second colour. Huge display type with extreme negative tracking — Unbounded is a WIDE face, so size it to the viewport (clamp(56px, 11vw, 168px)) and break lines so a whole word always fits — thin black rules, big photographs with hard edges. Section labels in mono.',
    moves: ['Ground = brand colour, ink = tinted black', 'Display sized with clamp(56px, 11vw, 168px), tracking -0.04em; never let a word overflow', 'Hard 1px black rules, no shadows'],
    motion: 'Quick 200ms snaps; marquee of one word at most.',
    imageBrief: 'High-contrast black-and-white or duotone photography so the ground colour dominates.',
    rules: { glow: false, gradientBudget: 0, heroMedia: 'photo', displayRatio: 10, tintedInk: true },
    notFor: 'Calm or luxury brands.',
    pitfall: 'Illegible if the ground is too light — keep ink at contrast >= 7.',
  }),
  dir({
    id: 'co-spec-poster', name: 'Technical spec poster', group: 'brand-block',
    anchors: [A('enerblock.net', 'SOTD', 'coral ground, near-black ink rgb(12,11,17), hairline grid, "SYSTEM / EST." mono labels, isometric mark, Neue Corp')],
    vibe: 'Saturated ground with hairline grid, mono spec labels and an isometric mark',
    bg: [5, 100, 64], fg: [236, 21, 5], primary: [236, 21, 5], primaryFg: [5, 100, 70], radius: '0rem',
    fonts: { display: 'Archivo', body: 'Archivo', mono: 'DM Mono', displayWeight: 700, displayTracking: '-0.01em' },
    fits: ['construction', 'prefab', 'engineering', 'architecture', 'hardware', 'energy', 'solar', 'building', 'infrastructure', 'machinery', 'steel', 'industrial'],
    composition: 'Hero on a saturated ground with a visible hairline grid, a 72px headline and a short subline left; a bold isometric geometric mark right. Mono labels ("SYSTEM", "EST. 2026", "REF 01") sit in grid cells. Photography comes after the hero.',
    moves: ['Visible 1px grid lines as structure', 'Mono spec labels in cells', 'A single geometric mark built from the logo'],
    motion: 'Grid lines draw in once; the mark rotates 20° on scroll.',
    imageBrief: 'Construction and material photography, raking light, close crops of joints and surfaces.',
    rules: { glow: false, gradientBudget: 0, heroMedia: 'spec-grid', displayRatio: 4, tintedInk: true },
    notFor: 'Soft consumer brands.',
    pitfall: 'Cliché if the "spec labels" say nothing — make them real facts.',
  }),
  // ───────────── physical businesses
  dir({
    id: 're-line-drawing', name: 'Architectural line drawing', group: 'physical',
    anchors: [A('belgradearbor.rs', 'SOTD', 'cream rgb(253,251,239), forest ink rgb(46,58,38), brass rgb(166,129,80), custom serif + Work Sans, line-drawn building hero, 107px/400')],
    vibe: 'Cream ground, forest-green ink, brass accent, a line-drawn building as the hero',
    bg: [51, 70, 96], fg: [96, 21, 19], primary: [34, 40, 34], primaryFg: [51, 70, 97], accent: [60, 50, 90], radius: '999px',
    fonts: { display: 'Newsreader', body: 'Work Sans', mono: 'DM Mono', displayWeight: 400, displayTracking: '-0.01em' },
    fits: ['real estate', 'property', 'property developer', 'real estate developer', 'residential', 'apartment', 'villa', 'architecture', 'interior', 'homes', 'plots', 'township', 'builder'],
    composition: 'Floating pill nav (menu / logo / inquire). Hero: a fine line drawing of the building filling the viewport on cream, brand name at 100px+ in the serif. Below: video bands, floor-plan cards and an amenities list set in a calm serif + sans pairing.',
    moves: ['Line-art hero instead of a photo', 'Pill-shaped nav with two actions', 'Forest-green ink; brass for lines and small details'],
    motion: 'Line drawing draws itself once (2s). Sections fade.',
    imageBrief: 'Architectural line drawings, elevations, then warm daylight interiors; no CGI gloss.',
    rules: { glow: false, gradientBudget: 1, heroMedia: 'line-art', displayRatio: 6, tintedInk: true },
    notFor: 'Fast-moving retail, SaaS.',
    pitfall: 'Needs the line art; generate it as clean SVG-style linework, not a render.',
  }),
  dir({
    id: 're-luxe-video', name: 'Luxe light + video', group: 'physical',
    anchors: [A('sobha-privy-collection.com', 'SOTD', 'white ground, ink rgb(26,25,25), TT Ramillas serif + grotesk, 68px weight 300 with +1.37px tracking, 12 videos')],
    vibe: 'White, tinted-black ink, serif + grotesk, light display with positive tracking, video-led',
    bg: [0, 0, 100], fg: [0, 2, 10], primary: [0, 2, 10], primaryFg: [0, 0, 100], accent: [38, 25, 93], radius: '0rem',
    fonts: { display: 'Cormorant Garamond', body: 'Inter Tight', mono: 'DM Mono', displayWeight: 300, displayTracking: '0.02em' },
    fits: ['luxury', 'villa', 'penthouse', 'wedding', 'bridal', 'resort', 'hotel', 'spa', 'jewellery', 'jewelry', 'watch', 'yacht', 'concierge', 'premium'],
    composition: 'Full-bleed video sections separated by white serif headlines (weight 300, WIDE letter-spacing). Minimal nav. Details in small grotesk caps. Plenty of white, one champagne tint for panels.',
    moves: ['Display light weight with POSITIVE tracking (+0.02em)', 'Video as the primary medium', 'Black pill buttons, champagne panels'],
    motion: 'Slow cross-fades (900ms); scroll-linked video scrub at most once.',
    imageBrief: 'Slow cinematic footage, golden-hour exteriors, empty rooms with long shadows. No people looking at the camera.',
    rules: { glow: false, gradientBudget: 0, heroMedia: 'video', displayRatio: 5, tintedInk: true },
    notFor: 'Budget or high-density commerce.',
    pitfall: 'Without good footage it is just white space — use stills with slow pans if there is no video.',
  }),
  dir({
    id: 'hs-expedition', name: 'Full-bleed expedition', group: 'physical',
    anchors: [A('white-desert.com', 'SOTD', 'white ground, navy ink rgb(31,42,68), Inter Tight + serif, 227px display, full-bleed expedition photo, glass nav pills')],
    vibe: 'A full-bleed photograph, glass nav pills, enormous display type, navy ink on white',
    bg: [0, 0, 100], fg: [222, 37, 19], primary: [222, 37, 19], primaryFg: [0, 0, 100], accent: [195, 40, 93], radius: '999px',
    fonts: { display: 'Inter Tight', body: 'Inter Tight', mono: 'DM Mono', displayWeight: 400, displayTracking: '-0.03em' },
    fits: ['travel', 'adventure', 'expedition', 'safari', 'tour', 'trek', 'trip', 'himalayan', 'ladakh', 'tour operator', 'getaway', 'backpacking', 'resort', 'hotel', 'lodge', 'camp', 'outdoor', 'wildlife', 'cruise', 'holiday'],
    composition: 'The hero is a single full-viewport photograph with glass-pill nav buttons top-left/right and a centred logo. Below, white sections with 200px+ headlines, serif accent lines, and large photographs.',
    moves: ['Glass pill navigation over the photograph', 'Display 160–230px', 'Navy ink on white; photography carries colour'],
    motion: 'Hero photo slow-zooms 6%; text reveals by line.',
    imageBrief: 'Dramatic natural-landscape photography with tiny human figures for scale; cold or warm light, not both.',
    rules: { glow: false, gradientBudget: 1, heroMedia: 'photo', displayRatio: 8, tintedInk: true },
    notFor: 'Software, data.',
    pitfall: 'A weak hero photo ruins it — insist on one striking image.',
  }),
  dir({
    id: 'fb-warm-appetite', name: 'Warm appetite', group: 'physical',
    anchors: [A('delice.ca', 'HM', 'cream rgb(248,239,220), signal red rgb(222,43,43), burgundy, Filson Soft + Ivy Mode serif display, mixed-weight hero line, action strip')],
    vibe: 'Warm cream, one signal red with burgundy, a serif display with mixed weights, an action strip over a food photo',
    bg: [41, 67, 92], fg: [0, 0, 13], primary: [0, 73, 48], primaryFg: [0, 0, 100], accent: [359, 40, 88], radius: '0.25rem',
    fonts: { display: 'DM Serif Display', body: 'Figtree', mono: 'DM Mono', displayWeight: 400, displayTracking: '-0.005em' },
    fits: ['restaurant', 'cafe', 'café', 'bakery', 'bistro', 'diner', 'pizza', 'pizzeria', 'kitchen', 'catering', 'dessert', 'sweets', 'brasserie', 'eatery', 'dhaba', 'canteen'],
    composition: 'Hero: a large warm food photograph, a serif headline set across two lines with one line lighter, short story copy, and a four-button action strip pinned at the bottom (Visit / Reserve / Order online / Gift card). Then menu highlights as photo cards and an opening-hours band.',
    moves: ['Headline mixes weights/italics across lines', 'A four-action strip is the main conversion device', 'Red only on actions; burgundy for text accents'],
    motion: 'Gentle 12px rise; image hover scale 1.03.',
    imageBrief: 'Warm, close, hands-in-frame food and people at tables; table-top light; slightly imperfect plating.',
    rules: { glow: false, gradientBudget: 0, heroMedia: 'photo', displayRatio: 4, tintedInk: false },
    notFor: 'B2B, tech.',
    pitfall: 'Stock food photography kills it — use warm, close, real-looking images.',
  }),
  dir({
    id: 'fb-oxblood-pop', name: 'Oxblood pop', group: 'physical',
    anchors: [A('burritomadre.rs', 'HM', 'peach rgb(250,232,223), oxblood ink rgb(95,14,0), orange-red rgb(248,62,28), Figtree only, pill buttons, big food photograph hero')],
    vibe: 'Peach ground, oxblood ink (never black), one orange-red, rounded pill buttons, a huge food photo',
    bg: [20, 73, 93], fg: [9, 100, 19], primary: [9, 92, 42], primaryFg: [0, 0, 100], radius: '999px',
    fonts: { display: 'Figtree', body: 'Figtree', mono: 'DM Mono', displayWeight: 700, displayTracking: '-0.03em' },
    fits: ['burrito', 'taco', 'street food', 'fast food', 'takeaway', 'delivery', 'juice', 'smoothie', 'snack', 'quick service', 'food truck', 'chaat', 'tiffin'],
    composition: 'A single typeface at one confident weight, a hero that is mostly one huge close-cropped food photograph, a floating pill "Order" button, then punchy short sections with rounded photo tiles.',
    moves: ['Ink is oxblood, not black', 'Pill buttons and rounded photo tiles', 'Short, loud copy'],
    motion: 'Buttons spring 1.04 on hover; tiles rise on entry.',
    imageBrief: 'Overhead and 3/4 food shots on a flat colour, saturated, shot to match the ground colour.',
    rules: { glow: false, gradientBudget: 0, heroMedia: 'photo', displayRatio: 3, tintedInk: true },
    notFor: 'Formal or luxury.',
    pitfall: 'Needs photography whose colours match the palette.',
  }),
  dir({
    id: 'ag-earth', name: 'Earth grotesk', group: 'physical', surfaces: ['website', 'app'],
    anchors: [A('farmminerals.com', 'SOTD', 'white + cream rgb(244,237,230), olive rgb(64,79,29), Aeonik only, 74px/500, tracking -1.5px, 70 images')],
    vibe: 'Warm cream and olive with one grotesk at weight 500; field and product photography',
    bg: [30, 39, 93], fg: [0, 0, 20], primary: [78, 46, 21], primaryFg: [30, 39, 94], accent: [74, 29, 88], radius: '0.5rem',
    fonts: { display: 'Hanken Grotesk', body: 'Hanken Grotesk', mono: 'DM Mono', displayWeight: 500, displayTracking: '-0.02em' },
    fits: ['agriculture', 'farm', 'fertilizer', 'fertiliser', 'seed', 'crop', 'rice', 'grain', 'export', 'spices', 'organic', 'agro', 'harvest', 'mill', 'dairy', 'tea', 'plantation', 'commodity'],
    composition: 'Cream ground, olive ink and buttons, a 74px weight-500 headline, field photography full-width, product packshots on cream, a quality/lab-results band and a clear enquiry form. Honest, practical, not "green-tech".',
    moves: ['Olive as ink AND action colour, cream as the surface', 'Packshots and field photos side by side', 'Certification and lab figures presented plainly'],
    motion: 'Quiet fades only.',
    imageBrief: 'Real fields at golden hour, hands holding grain, sacks and packaging on cream; no stock "green leaf" icons.',
    rules: { glow: false, gradientBudget: 0, heroMedia: 'photo', displayRatio: 4, tintedInk: true },
    notFor: 'Fashion, software.',
    pitfall: 'Don\'t reach for lime-green tech gradients; keep it earthy.',
  }),
  dir({
    id: 'fa-mono-lookbook', name: 'Monochrome lookbook', group: 'physical',
    anchors: [A('serotoninn.com', 'SOTD', 'off-white rgb(255,249,247), black/white, red rgb(237,56,51), Thunder condensed + PP Fraktion Mono, 395 images, 31 videos')],
    vibe: 'Black-and-white photographic cut-outs, a condensed display face, mono captions, one red',
    bg: [15, 100, 98], fg: [0, 0, 5], primary: [2, 80, 46], primaryFg: [0, 0, 100], radius: '0rem',
    fonts: { display: 'Anton', body: 'Hanken Grotesk', mono: 'DM Mono', displayWeight: 400, displayTracking: '0.01em' },
    fits: ['fashion', 'clothing', 'apparel', 'streetwear', 'boutique', 'garment', 'denim', 'saree', 'kurta', 'footwear', 'lookbook', 'label', 'designer', 'wear'],
    composition: 'Model cut-outs (isolated on the off-white ground) at huge scale, a condensed uppercase display, mono captions (look numbers, sizes, price), a dense grid of product cut-outs, one red for sale/new tags.',
    moves: ['Cut-out photography on flat ground', 'Condensed uppercase display + mono captions', 'One red only for tags'],
    motion: 'Quick cuts: images swap on hover without easing.',
    imageBrief: 'Black-and-white studio fashion photography, hard flash, clean isolation. Generate with a plain background so it can be cut out.',
    rules: { glow: false, gradientBudget: 0, heroMedia: 'cutouts', displayRatio: 6, tintedInk: false },
    notFor: 'Services, B2B.',
    pitfall: 'Poor cut-outs look cheap — insist on clean isolation.',
  }),
  // ───────────── human / wellbeing / learning
  dir({
    id: 'hl-anti-clinical', name: 'Anti-clinical health', group: 'human',
    anchors: [A('pomegranate.health', 'HM', 'cream rgb(247,239,223), wine ink rgb(58,0,29), pink, Gliker rounded display, stacked-tab cards, illustrated mark')],
    vibe: 'Cream, wine ink, warm pink — a friendly rounded display face and stacked-card layout, not clinical',
    bg: [40, 60, 92], fg: [330, 100, 11], primary: [350, 70, 46], primaryFg: [0, 0, 100], radius: '1.25rem',
    fonts: { display: 'Fredoka', body: 'Nunito', mono: 'DM Mono', displayWeight: 600, displayTracking: '0.005em' },
    fits: ['health', 'wellness', 'therapy', 'mental health', 'clinic', 'dental', 'dentist', 'pharmacy', 'nutrition', 'fertility', 'women', 'care', 'physio', 'yoga', 'ayurveda'],
    composition: 'A friendly illustrated mark, a rounded display headline in wine on cream, layered coloured tabs/cards stacked like folders, one pink action. Plain-language copy.',
    moves: ['Wine ink on cream, never black on white', 'Stacked tab cards as the layout device', 'Hand-drawn or illustrated mascot'],
    motion: 'Tabs slide 12px; mascot blinks once.',
    imageBrief: 'Soft illustrations and real-people portraits; no clinical stock, no stethoscopes.',
    rules: { glow: false, gradientBudget: 0, heroMedia: 'illustration', displayRatio: 4, tintedInk: true },
    notFor: 'Enterprise medical devices.',
    pitfall: 'Playful tone must not undermine trust — keep medical claims sober. Generated smiles or portraits are illustrations: never label them real patients or real results, and never invent credentials for a doctor.',
  }),
  dir({
    id: 'il-joyful', name: 'Joyful illustration', group: 'human',
    anchors: [A('maximatherapy.com', 'SOTD', 'sunny yellow field, black ink, cobalt rgb(38,104,253), orange-red rgb(253,68,1), flat illustrated characters, 0 photos, 0 gradients, rounded type')],
    vibe: 'A saturated field colour, flat illustrated characters instead of photos, rounded type, black ink',
    bg: [46, 100, 62], fg: [0, 0, 5], primary: [222, 98, 50], primaryFg: [0, 0, 100], radius: '1.5rem',
    fonts: { display: 'Baloo 2', body: 'Nunito', mono: 'DM Mono', displayWeight: 700, displayTracking: '0em' },
    fits: ['kids', 'children', 'school', 'preschool', 'tutor', 'therapy', 'autism', 'neurodivergent', 'play', 'toy', 'education', 'learning', 'camp', 'daycare', 'coaching'],
    composition: 'A full-bleed field colour with large flat illustrated characters and shapes, a rounded bold headline, chunky buttons, content in rounded colour panels. No photographs at all.',
    moves: ['Flat character illustration as the hero', 'Chunky rounded panels in 3 flat colours', 'Black ink on a saturated ground'],
    motion: 'Characters bob 6px; panels pop in with a small overshoot.',
    imageBrief: 'Flat vector-style illustration, thick simple shapes, 3–4 flat colours, friendly characters with simple faces, transparent background.',
    rules: { glow: false, gradientBudget: 0, heroMedia: 'illustration', displayRatio: 4, tintedInk: false },
    notFor: 'Serious finance or legal.',
    pitfall: 'Illustration quality is everything; weak clip-art is worse than photos.',
  }),
  dir({
    id: 'ed-gradient-field', name: 'Gradient field + mono', group: 'human',
    anchors: [A('why.zero.university', 'SOTM', 'deep green rgb(28,72,57) gradient field, Supply Sans + PP Supply Mono, giant counter')],
    vibe: 'One saturated hue as a full-bleed gradient field, mono UI type, a giant counter',
    bg: [160, 44, 20], fg: [150, 30, 96], primary: [150, 40, 92], primaryFg: [160, 44, 14], radius: '0.5rem',
    gradientHero: 'radial-gradient(120% 100% at 50% 110%, hsl(160 40% 55% / 0.9), transparent 60%)',
    fonts: { display: 'Space Grotesk', body: 'Space Grotesk', mono: 'DM Mono', displayWeight: 500, displayTracking: '-0.02em' },
    fits: ['university', 'bootcamp', 'cohort', 'course', 'program', 'programme', 'fellowship', 'career', 'hiring', 'accelerator', 'training', 'upskill'],
    composition: 'A full-bleed gradient field in ONE hue family (deep to luminous), a giant live counter or number as the hero, small mono labels, a plain white-on-green content layout. The gradient is the brand material and appears once per screen.',
    moves: ['One-hue gradient field as the brand surface', 'Giant numerals', 'Mono labels for metadata'],
    motion: 'The gradient breathes slowly (12s); the counter ticks on load.',
    imageBrief: 'Mostly none; if used, duotone portraits in the field hue.',
    rules: { glow: false, gradientBudget: 3, heroMedia: 'gradient-field', displayRatio: 8, tintedInk: false },
    notFor: 'Retail; anything photo-led.',
    pitfall: 'A gradient in many hues is just a rainbow — keep to one hue family.',
  }),
  dir({
    id: 'lg-wordmark', name: 'Giant wordmark', group: 'human',
    anchors: [A('ario.law', 'HM', '300px wordmark, one custom sans, blue gradient field, black/white only')],
    vibe: 'A colossal wordmark on one deep field, a single sans, black and white only',
    bg: [0, 0, 100], fg: [0, 0, 5], primary: [208, 88, 30], primaryFg: [0, 0, 100], radius: '0rem',
    fonts: { display: 'Archivo Black', body: 'Hanken Grotesk', mono: 'DM Mono', displayWeight: 400, displayTracking: '-0.02em' },
    fits: ['law firm', 'law', 'lawyer', 'legal', 'advocate', 'attorney', 'consultancy', 'consulting', 'advisory', 'chartered', 'accountant', 'ca firm', 'audit', 'notary', 'tax'],
    composition: 'The firm\'s name as a 200–300px wordmark filling the hero on a deep brand-blue field; below, a white page with one confident sentence, practice areas as a plain numbered list, partner portraits in black-and-white, and a direct contact block.',
    moves: ['The wordmark IS the hero', 'Black-and-white portraits', 'Numbered practice areas in plain text'],
    motion: 'Letters slide in individually once; nothing else moves.',
    imageBrief: 'Black-and-white portraits, architecture details, no gavels or scales.',
    rules: { glow: false, gradientBudget: 1, heroMedia: 'type', displayRatio: 12, tintedInk: false },
    notFor: 'Playful consumer brands.',
    pitfall: 'A long firm name will not fit at this scale — use the short form.',
  }),
  dir({
    id: 'ngo-human-donate', name: 'Human photograph + inline giving', group: 'human',
    anchors: [A('charitywater.org', 'leader', 'white, ink rgb(34,37,32), one yellow, Proxima Nova + Kazimir serif, real portrait hero with the donation module inside the hero')],
    vibe: 'A real human portrait, a serif headline, and the donation module inside the hero — one yellow',
    bg: [0, 0, 100], fg: [96, 7, 12], primary: [47, 100, 50], primaryFg: [96, 7, 10], radius: '0.25rem',
    fonts: { display: 'Young Serif', body: 'Nunito', mono: 'DM Mono', displayWeight: 400, displayTracking: '-0.005em' },
    fits: ['ngo', 'nonprofit', 'non-profit', 'charity', 'donation', 'temple', 'mandir', 'gurudwara', 'church', 'mosque', 'religious', 'foundation', 'trust', 'donate', 'fundraising', 'relief', 'welfare', 'volunteer', 'society', 'campaign', 'cause'],
    composition: 'A full-bleed portrait of a real person, a serif headline left, a donation module (amount chips, monthly/once toggle, one yellow button) in a card over the hero. Then impact numbers in plain language, field stories, transparent finances.',
    moves: ['Giving module inside the hero', 'Real faces, dignified framing', 'One brand yellow'],
    motion: 'Impact numbers count up once.',
    imageBrief: 'Documentary portraits of real people in natural light, eye-level, genuine expressions; never pity framing.',
    rules: { glow: false, gradientBudget: 0, heroMedia: 'photo', displayRatio: 3, tintedInk: true },
    notFor: 'Commercial brands.',
    pitfall: 'Never invent beneficiaries or statistics.',
  }),
  // ───────────── marketplace / tool
  dir({
    id: 'mk-photo-grid', name: 'Photo-grid marketplace', group: 'tool', surfaces: ['website', 'app'],
    anchors: [A('airbnb.com', 'leader', 'white, ink rgb(34,34,34), Airbnb Cereal only, one brand red, the photo grid is the UI')],
    vibe: 'White, soft black ink, one family, one brand colour — the listing photographs are the interface',
    bg: [0, 0, 100], fg: [0, 0, 13], primary: [350, 85, 48], primaryFg: [0, 0, 100], radius: '0.75rem',
    fonts: { display: 'Figtree', body: 'Figtree', mono: 'DM Mono', displayWeight: 700, displayTracking: '-0.01em' },
    fits: ['marketplace', 'listings', 'rentals', 'booking', 'directory', 'classifieds', 'stays', 'hire', 'vendors', 'catalogue', 'aggregator', 'platform for'],
    composition: 'A floating rounded search bar at the top, then a dense responsive grid of large rounded photo cards with tiny metadata lines (price, rating, location). Filters as pill chips. Detail pages lead with a photo mosaic.',
    moves: ['Photo grid is the UI; chrome stays minimal', 'Rounded 12px cards, no shadows at rest', 'One brand colour for the search action and favourites'],
    motion: 'Card hover lift 2px; heart toggles with a spring.',
    imageBrief: 'Bright, honest listing photos in consistent 4:3 crops.',
    rules: { glow: false, gradientBudget: 0, heroMedia: 'photo', displayRatio: 3, tintedInk: true },
    notFor: 'Brand-led single-product sites.',
    pitfall: 'Bad listing photos sink it — placeholder photography must still look real.',
  }),
  dir({
    id: 'app-owned-tool', name: 'Owned-personality tool', group: 'tool', surfaces: ['website', 'app'],
    anchors: [A('excalidraw.com', 'leader', 'white, ink rgb(27,27,31), one indigo accent, Assistant + Excalifont handwriting, floating toolbar, canvas as hero')],
    vibe: 'A quiet utility with one expressive typeface and a floating toolbar; the work surface is the hero',
    bg: [0, 0, 100], fg: [240, 7, 11], primary: [215, 80, 42], radius: '0.5rem',
    fonts: { display: 'Caveat', body: 'Instrument Sans', mono: 'DM Mono', displayWeight: 700, displayTracking: '0em' },
    fits: ['whiteboard', 'notes', 'note taking', 'habit', 'habit tracker', 'recipe', 'bookmark', 'flashcard', 'note-taking', 'notebook', 'journal', 'diary', 'to-do', 'todo', 'editor', 'canvas', 'planner', 'notebook', 'draw', 'sketch', 'productivity', 'utility', 'tool', 'tracker', 'calculator', 'converter'],
    composition: 'The tool is the page: a floating toolbar, the canvas/work surface filling the screen, a small welcome overlay with three actions. The expressive display face is used only for the product name and empty states.',
    moves: ['Floating rounded toolbar over a clean surface', 'One expressive typeface, used sparingly', 'One accent colour for the active tool'],
    motion: 'Tool selection snaps in 120ms; no ambient motion.',
    imageBrief: 'None — screenshots of the real tool; hand-drawn doodles for empty states.',
    rules: { glow: false, gradientBudget: 0, heroMedia: 'product-ui', displayRatio: 2.5, tintedInk: true },
    notFor: 'Marketing-heavy brand sites.',
    pitfall: 'Handwriting font in body text hurts readability — keep it to headings.',
  }),
]

export const DIRECTION_IDS = DIRECTIONS.map(d => d.id)

export function getDirectionById(id: string | undefined | null): Direction | undefined {
  if (!id) return undefined
  return DIRECTIONS.find(d => d.id === id)
}
