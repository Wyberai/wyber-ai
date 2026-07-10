// Curated, hand-tuned design palettes injected into every fresh web build.
//
// Lovable lets the model improvise hex colors — which often drifts generic or
// low-contrast. We instead inject a complete, accessible, domain-matched HSL
// token set (the shadcn token names from design-system.ts) as a concrete DESIGN
// BRIEF. The model gets a beautiful starting palette for free and only has to
// build; freshness comes from picking a different palette per build. Every value
// here is tuned for contrast (foreground legible on its surface, primary-
// foreground legible on primary).

export interface Palette {
  id: string
  label: string // short human name for UI (theme cards, plan-mode direction picker)
  vibe: string // one-line brief shown to the model
  mode: 'light' | 'dark'
  fontSans: string // from the curated font menu (see design-system.ts)
  fontDisplay: string
  radius: string
  tokens: Record<string, string> // shadcn token name → HSL channels ("245 70% 55%")
  gradientHero: string
  domains: string[] // keywords used to match the user's prompt
}

// Shared neutral scaffolds — each palette overrides the brand bits (primary,
// ring, accents, surface tint). Keeps contrast consistent across the set.
const darkBase = (over: Record<string, string>): Record<string, string> => ({
  background: '240 10% 5%', foreground: '0 0% 98%',
  card: '240 10% 7%', 'card-foreground': '0 0% 98%',
  popover: '240 10% 7%', 'popover-foreground': '0 0% 98%',
  secondary: '240 6% 14%', 'secondary-foreground': '0 0% 98%',
  muted: '240 6% 14%', 'muted-foreground': '240 5% 65%',
  accent: '240 6% 16%', 'accent-foreground': '0 0% 98%',
  destructive: '0 72% 51%', 'destructive-foreground': '0 0% 98%',
  border: '240 6% 16%', input: '240 6% 16%', ring: '0 0% 83%',
  ...over,
})

const lightBase = (over: Record<string, string>): Record<string, string> => ({
  background: '0 0% 100%', foreground: '240 10% 10%',
  card: '0 0% 100%', 'card-foreground': '240 10% 10%',
  popover: '0 0% 100%', 'popover-foreground': '240 10% 10%',
  secondary: '240 5% 96%', 'secondary-foreground': '240 6% 10%',
  muted: '240 5% 96%', 'muted-foreground': '240 4% 46%',
  accent: '240 5% 96%', 'accent-foreground': '240 6% 10%',
  destructive: '0 84% 60%', 'destructive-foreground': '0 0% 98%',
  border: '240 6% 90%', input: '240 6% 90%', ring: '240 10% 10%',
  ...over,
})

export const PALETTES: Palette[] = [
  // ── Finance / fintech / crypto ──
  {
    id: 'fintech-emerald-dark', label: 'Emerald Ledger', vibe: 'Premium fintech — deep slate canvas, confident emerald primary, calm and precise', mode: 'dark',
    fontSans: 'Switzer', fontDisplay: 'General Sans', radius: '0.625rem',
    tokens: darkBase({ background: '222 30% 6%', card: '222 28% 8%', popover: '222 28% 8%', border: '222 20% 15%', input: '222 20% 15%', primary: '152 64% 46%', 'primary-foreground': '152 80% 7%', ring: '152 64% 46%' }),
    gradientHero: 'radial-gradient(120% 120% at 80% 0%, hsl(152 64% 46% / 0.18), transparent 60%)',
    domains: ['finance', 'fintech', 'bank', 'crypto', 'invest', 'wallet', 'payment', 'trading', 'budget', 'accounting'],
  },
  {
    id: 'fintech-blue-light', label: 'Cobalt Clean', vibe: 'Trustworthy fintech — clean white, decisive cobalt blue, data-forward', mode: 'light',
    fontSans: 'Switzer', fontDisplay: 'General Sans', radius: '0.625rem',
    tokens: lightBase({ primary: '221 83% 53%', 'primary-foreground': '0 0% 100%', ring: '221 83% 53%', secondary: '221 40% 96%', accent: '221 40% 96%', 'accent-foreground': '221 50% 25%' }),
    gradientHero: 'linear-gradient(135deg, hsl(221 83% 53% / 0.10), hsl(199 89% 60% / 0.10))',
    domains: ['finance', 'fintech', 'bank', 'invoice', 'payroll', 'saas', 'b2b', 'enterprise'],
  },
  // ── Wellness / health / fitness ──
  {
    id: 'wellness-sage-light', label: 'Sage & Cream', vibe: 'Calm wellness — warm cream base, sage-teal primary, airy and human', mode: 'light',
    fontSans: 'Switzer', fontDisplay: 'General Sans', radius: '1rem',
    tokens: lightBase({ background: '80 33% 98%', foreground: '150 14% 14%', card: '80 33% 99%', muted: '120 16% 94%', 'muted-foreground': '150 8% 40%', secondary: '120 16% 94%', accent: '28 80% 92%', 'accent-foreground': '20 50% 30%', border: '120 14% 88%', input: '120 14% 88%', primary: '160 45% 38%', 'primary-foreground': '0 0% 100%', ring: '160 45% 38%' }),
    gradientHero: 'linear-gradient(160deg, hsl(160 45% 38% / 0.12), hsl(28 80% 60% / 0.10))',
    domains: ['wellness', 'health', 'fitness', 'yoga', 'meditation', 'therapy', 'medical', 'care', 'nutrition', 'spa', 'mental'],
  },
  {
    id: 'wellness-teal-dark', label: 'Deep Aqua', vibe: 'Modern health — deep teal canvas, luminous aqua primary, focused', mode: 'dark',
    fontSans: 'Switzer', fontDisplay: 'General Sans', radius: '0.875rem',
    tokens: darkBase({ background: '195 40% 6%', card: '195 35% 8%', popover: '195 35% 8%', border: '195 25% 15%', input: '195 25% 15%', primary: '172 70% 46%', 'primary-foreground': '195 60% 8%', ring: '172 70% 46%' }),
    gradientHero: 'radial-gradient(120% 100% at 50% 0%, hsl(172 70% 46% / 0.18), transparent 65%)',
    domains: ['wellness', 'health', 'fitness', 'workout', 'sleep', 'habit', 'tracker', 'medical'],
  },
  // ── Creative / design / portfolio ──
  {
    id: 'creative-violet-dark', label: 'Electric Violet', vibe: 'Bold creative — near-black violet canvas, electric violet→pink, expressive', mode: 'dark',
    fontSans: 'Switzer', fontDisplay: 'General Sans', radius: '1rem',
    tokens: darkBase({ background: '255 30% 6%', card: '255 28% 8%', popover: '255 28% 8%', border: '255 20% 16%', input: '255 20% 16%', primary: '270 80% 65%', 'primary-foreground': '0 0% 100%', accent: '320 40% 18%', 'accent-foreground': '320 80% 88%', ring: '270 80% 65%' }),
    gradientHero: 'linear-gradient(135deg, hsl(270 80% 65% / 0.25), hsl(330 80% 60% / 0.22))',
    domains: ['creative', 'design', 'portfolio', 'art', 'agency', 'studio', 'music', 'photo', 'nft', 'gallery'],
  },
  {
    id: 'creative-coral-light', label: 'Coral Editorial', vibe: 'Editorial-creative — warm paper base, rose-coral primary, refined serif headings', mode: 'light',
    fontSans: 'Switzer', fontDisplay: 'Playfair Display', radius: '0.75rem',
    tokens: lightBase({ background: '30 40% 99%', foreground: '255 18% 12%', muted: '20 30% 95%', 'muted-foreground': '255 8% 42%', secondary: '20 30% 95%', accent: '350 70% 95%', 'accent-foreground': '350 60% 35%', border: '20 24% 90%', input: '20 24% 90%', primary: '350 78% 58%', 'primary-foreground': '0 0% 100%', ring: '350 78% 58%' }),
    gradientHero: 'linear-gradient(135deg, hsl(350 78% 58% / 0.12), hsl(28 85% 62% / 0.12))',
    domains: ['creative', 'portfolio', 'blog', 'magazine', 'fashion', 'beauty', 'wedding', 'event', 'brand'],
  },
  // ── SaaS / tech / dashboard / tool ──
  {
    id: 'saas-indigo-dark', label: 'Graphite Indigo', vibe: 'Linear-precise SaaS — graphite canvas, indigo primary, crisp and technical', mode: 'dark',
    fontSans: 'Switzer', fontDisplay: 'General Sans', radius: '0.625rem',
    tokens: darkBase({ background: '240 10% 5%', primary: '243 75% 62%', 'primary-foreground': '0 0% 100%', ring: '243 75% 62%' }),
    gradientHero: 'radial-gradient(120% 120% at 100% 0%, hsl(243 75% 62% / 0.20), transparent 60%)',
    domains: ['saas', 'dashboard', 'admin', 'tool', 'analytics', 'crm', 'tech', 'developer', 'api', 'platform', 'internal'],
  },
  {
    id: 'saas-indigo-light', label: 'Indigo Air', vibe: 'Clean SaaS — bright white, indigo primary, strong hierarchy, lots of air', mode: 'light',
    fontSans: 'Switzer', fontDisplay: 'General Sans', radius: '0.625rem',
    tokens: lightBase({ primary: '243 75% 59%', 'primary-foreground': '0 0% 100%', ring: '243 75% 59%', secondary: '243 30% 96%', accent: '243 30% 96%', 'accent-foreground': '243 50% 30%' }),
    gradientHero: 'linear-gradient(135deg, hsl(243 75% 59% / 0.10), hsl(270 70% 62% / 0.10))',
    domains: ['saas', 'dashboard', 'tool', 'startup', 'landing', 'product', 'app'],
  },
  // ── Luxury / premium / real estate ──
  {
    id: 'luxury-gold-dark', label: 'Champagne Noir', vibe: 'Luxury minimal — true-black, champagne-gold accent, generous negative space, elegant', mode: 'dark',
    fontSans: 'Switzer', fontDisplay: 'Playfair Display', radius: '0.5rem',
    tokens: darkBase({ background: '40 10% 5%', foreground: '40 20% 94%', card: '40 8% 7%', popover: '40 8% 7%', muted: '40 6% 13%', 'muted-foreground': '40 10% 62%', secondary: '40 6% 13%', accent: '40 30% 14%', 'accent-foreground': '40 60% 80%', border: '40 8% 15%', input: '40 8% 15%', primary: '40 68% 56%', 'primary-foreground': '40 40% 8%', ring: '40 68% 56%' }),
    gradientHero: 'linear-gradient(135deg, hsl(40 68% 56% / 0.16), transparent 60%)',
    domains: ['luxury', 'premium', 'real estate', 'realestate', 'property', 'jewelry', 'hotel', 'concierge', 'private', 'exclusive'],
  },
  // ── Editorial / blog / education ──
  {
    id: 'editorial-ink-light', label: 'Ink & Paper', vibe: 'Editorial — warm off-white, near-black ink, terracotta accent, serif display, reading-first', mode: 'light',
    fontSans: 'Switzer', fontDisplay: 'Playfair Display', radius: '0.375rem',
    tokens: lightBase({ background: '40 33% 98%', foreground: '20 14% 12%', card: '40 33% 99%', muted: '40 20% 94%', 'muted-foreground': '20 8% 40%', secondary: '40 20% 94%', accent: '20 60% 94%', 'accent-foreground': '20 60% 32%', border: '40 16% 88%', input: '40 16% 88%', primary: '18 72% 48%', 'primary-foreground': '0 0% 100%', ring: '18 72% 48%' }),
    gradientHero: 'linear-gradient(135deg, hsl(18 72% 48% / 0.10), hsl(40 60% 60% / 0.10))',
    domains: ['blog', 'magazine', 'news', 'education', 'course', 'school', 'book', 'writer', 'newsletter', 'docs', 'content'],
  },
  // ── Food / restaurant / ecommerce ──
  {
    id: 'food-amber-light', label: 'Amber Warmth', vibe: 'Appetizing food — warm white, amber-orange primary, friendly rounded, mouthwatering', mode: 'light',
    fontSans: 'Switzer', fontDisplay: 'General Sans', radius: '1rem',
    tokens: lightBase({ background: '36 50% 99%', foreground: '20 14% 14%', muted: '30 35% 95%', 'muted-foreground': '20 8% 42%', secondary: '30 35% 95%', accent: '25 90% 94%', 'accent-foreground': '20 80% 36%', border: '30 24% 90%', input: '30 24% 90%', primary: '25 90% 53%', 'primary-foreground': '0 0% 100%', ring: '25 90% 53%' }),
    gradientHero: 'linear-gradient(135deg, hsl(25 90% 53% / 0.14), hsl(45 95% 58% / 0.14))',
    domains: ['food', 'restaurant', 'cafe', 'menu', 'recipe', 'delivery', 'ecommerce', 'shop', 'store', 'retail', 'coffee'],
  },
  // ── Playful / social / community ──
  {
    id: 'playful-grape-light', label: 'Grape Pop', vibe: 'Playful & social — bright base, saturated grape-purple primary, rounded and cheerful', mode: 'light',
    fontSans: 'Switzer', fontDisplay: 'General Sans', radius: '1.25rem',
    tokens: lightBase({ background: '270 40% 99%', muted: '270 30% 96%', 'muted-foreground': '270 6% 44%', secondary: '270 30% 96%', accent: '160 60% 92%', 'accent-foreground': '160 50% 28%', border: '270 20% 91%', input: '270 20% 91%', primary: '268 75% 60%', 'primary-foreground': '0 0% 100%', ring: '268 75% 60%' }),
    gradientHero: 'linear-gradient(135deg, hsl(268 75% 60% / 0.16), hsl(330 80% 65% / 0.14))',
    domains: ['social', 'community', 'kids', 'game', 'fun', 'event', 'dating', 'chat', 'forum', 'club'],
  },
]

const SANS_FALLBACK = "ui-sans-serif, system-ui, sans-serif"

// Generic/structural keywords that describe ANY app, not a vertical. These must
// NOT narrow the palette pool — otherwise "todo app" / "dashboard" always lands
// on the same (indigo) SaaS palettes and every build looks identical. Only a
// STRONG vertical signal (finance, health, food, luxury…) narrows the pool;
// everything else gets the full 12-palette spread for real per-build variety.
const WEAK_DOMAINS = new Set([
  'saas', 'dashboard', 'tool', 'startup', 'landing', 'product', 'app',
  'admin', 'platform', 'internal', 'b2b', 'enterprise', 'website', 'site',
])

/** Pick a palette: narrow to a vertical only on a STRONG domain hint, else full
 *  pool (random) so generic apps get fresh colors each build. */
export function pickPalette(prompt: string, rnd: () => number = Math.random): Palette {
  const p = (prompt || '').toLowerCase()
  const matched = PALETTES.filter((pal) =>
    pal.domains.some((d) => !WEAK_DOMAINS.has(d) && p.includes(d)),
  )
  const pool = matched.length > 0 ? matched : PALETTES
  return pool[Math.floor(rnd() * pool.length)]
}

/** Look up a palette by its stable id (e.g. from a client-sent paletteId). */
export function getPaletteById(id: string | undefined | null): Palette | undefined {
  if (!id) return undefined
  return PALETTES.find((pal) => pal.id === id)
}

/** Pick n DISTINCT palette options for a "choose a direction" UI. Strong-domain
 *  matches come first (same narrowing rule as pickPalette); the rest are filled
 *  greedily for contrast — prefer a mode (light/dark) and id-family not already
 *  represented, so the options genuinely look different side by side. */
export function pickPaletteOptions(prompt: string, n = 3, rnd: () => number = Math.random): Palette[] {
  const p = (prompt || '').toLowerCase()
  const matched = PALETTES.filter((pal) =>
    pal.domains.some((d) => !WEAK_DOMAINS.has(d) && p.includes(d)),
  )
  const shuffle = (arr: Palette[]): Palette[] => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
  const family = (pal: Palette) => pal.id.split('-')[0]
  const picked: Palette[] = []
  const takeDiverse = (pool: Palette[]) => {
    let candidates = shuffle(pool)
    while (picked.length < n && candidates.length > 0) {
      const modes = new Set(picked.map((x) => x.mode))
      const families = new Set(picked.map(family))
      let best = candidates[0]
      let bestScore = -1
      for (const pal of candidates) {
        const score = (modes.has(pal.mode) ? 0 : 2) + (families.has(family(pal)) ? 0 : 1)
        if (score > bestScore) { best = pal; bestScore = score }
      }
      picked.push(best)
      candidates = candidates.filter((pal) => pal.id !== best.id)
    }
  }
  takeDiverse(matched)
  takeDiverse(PALETTES.filter((pal) => !picked.some((x) => x.id === pal.id)))
  return picked
}

/** Render a palette as the exact src/index.css :root block + a one-line brief. */
export function renderDesignBrief(pal: Palette): string {
  const order = [
    'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
    'primary', 'primary-foreground', 'secondary', 'secondary-foreground',
    'muted', 'muted-foreground', 'accent', 'accent-foreground',
    'destructive', 'destructive-foreground', 'border', 'input', 'ring',
  ]
  const lines = order
    .filter((k) => pal.tokens[k])
    .map((k) => `  --${k}: ${pal.tokens[k]};`)
    .join('\n')
  const darkClass = pal.mode === 'dark'
    ? `\nIMPORTANT: this is a DARK theme — add className="dark" to the root element (or set it on <html>) and keep that base.`
    : ''
  return `\n\n━━━ DESIGN BRIEF — use this palette (${pal.vibe}) ━━━
Put these tokens in src/index.css :root, then build with semantic classes only (bg-background, bg-primary, text-foreground, border-border…). Keep this palette + contrast; don't fall back to a generic theme. Unless the user gave their own colors/brand, commit to this direction.
:root {
${lines}
  --radius: ${pal.radius};
  --font-sans: '${pal.fontSans}', ${SANS_FALLBACK};
  --font-display: '${pal.fontDisplay}', '${pal.fontSans}', ${SANS_FALLBACK};
  --gradient-hero: ${pal.gradientHero};
}
Use bg-[image:var(--gradient-hero)] for hero backdrops.${darkClass}`
}
