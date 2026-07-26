// App-theme read/write — Session C owns this file.
//
// A generated app's theme is nothing but the shadcn-style token values in its
// src/index.css :root{} block (see design-system.ts for the contract). That
// file lives inside projects.files (jsonb), so retheming an app is a pure
// string rewrite + normal project save: 0 LLM credits, no rebuild round-trip
// needed for preview (the bridge's wyber-apply-theme upserts a <style> tag
// instantly), and publish parity is automatic because index.css IS the
// publish source.

import type { Palette } from './design-palettes'

export interface AppTheme {
  /** token name (without --) → HSL channels, e.g. { primary: "199 89% 48%" } */
  tokens: Record<string, string>
  radius?: string
  fontSans?: string
  fontDisplay?: string
  fontMono?: string
}

// Color tokens the panel edits/serializes, in canonical order.
export const COLOR_TOKENS = [
  'background', 'foreground',
  'card', 'card-foreground',
  'popover', 'popover-foreground',
  'primary', 'primary-foreground',
  'secondary', 'secondary-foreground',
  'muted', 'muted-foreground',
  'accent', 'accent-foreground',
  'destructive', 'destructive-foreground',
  'border', 'input', 'ring',
] as const

// Curated faces — must stay a subset of design-system.ts GOOGLE_FONTS_LINKS
// (every one of these loads in every preview and published app).
export const CURATED_FONTS = {
  sans: ['Switzer', 'General Sans'],
  display: ['General Sans', 'Instrument Serif', 'Fraunces', 'Playfair Display', 'Lora', 'Switzer'],
} as const

const strip = (v: string) => v.trim().replace(/^['"]|['"]$/g, '')

// Every prebuilt gallery template (src/lib/templates/prebuilt/*.ts) ships its
// own hand-rolled token set — --bg/--surface/--accent/--text/--border, read
// as literal colors directly (`background: var(--bg)`), NOT the shadcn
// --background/--primary set above (which those templates' markup never
// references at all). Applying a theme without this mapping silently writes
// tokens nothing reads: the save succeeds, but the preview shows no change.
// This overlay writes the legacy names too — wrapped in hsl() since that's
// what a literal `var(--bg)` usage expects — so a theme apply actually
// changes something on template-originated projects, not just on
// from-scratch chat-generated ones (which do use the shadcn set).
const LEGACY_TOKEN_MAP: Record<string, string> = {
  background: 'bg',
  foreground: 'text',
  card: 'surface',
  popover: 'surface',
  muted: 'elevated',
  'muted-foreground': 'text-2',
  primary: 'accent',
  ring: 'accent',
  input: 'border',
  border: 'border',
  destructive: 'error',
}

function applyLegacyTokenOverlay(preserved: Record<string, string>, theme: AppTheme): void {
  for (const [slot, legacyName] of Object.entries(LEGACY_TOKEN_MAP)) {
    const val = theme.tokens[slot]
    if (val !== undefined) preserved[legacyName] = `hsl(${val})`
  }
  if (theme.radius) { preserved['r'] = theme.radius; preserved['r-lg'] = theme.radius }
}

/** Extract the first block whose opening matches `selector { … }` (brace-depth
 *  aware, so nested rules inside don't confuse the span), with its source span. */
function findBlock(css: string, selector: RegExp): { body: string; start: number; end: number } | null {
  const m = css.match(selector)
  if (!m || m.index === undefined) return null
  const open = m.index + m[0].length
  let depth = 1
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}' && --depth === 0) {
      return { body: css.slice(open, i), start: m.index, end: i + 1 }
    }
  }
  return null
}

function rootBlock(css: string): { body: string; start: number; end: number } | null {
  return findBlock(css, /:root\s*\{/)
}

/** A project that has ever had "Add dark mode" applied defines its own
 *  `.dark { --primary: …; … }` override — CSS class selectors beat :root on
 *  the same-specificity tie, source-order-last, so whenever dark mode is
 *  active this block's OWN values win over anything written to :root. Apply
 *  a theme to :root only and the app looks completely unchanged in dark
 *  mode — the save succeeds, the render doesn't reflect it, and it reads
 *  exactly like "themes don't work". Must be kept in sync with :root. */
function darkBlock(css: string): { body: string; start: number; end: number } | null {
  return findBlock(css, /\.dark\s*\{/)
}

function parseDecls(body: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of body.matchAll(/--([\w-]+)\s*:\s*([^;}]+)[;}]?/g)) {
    out[m[1]] = m[2].trim()
  }
  return out
}

// Some prebuilt templates set a bare (non-custom-property) declaration
// directly on :root — e.g. `font-family:'Space Grotesk',sans-serif` inline
// with the --tokens, instead of via a --font-sans var. serializeRootBody
// only ever reconstructs `--`-prefixed declarations, so without this a theme
// apply would silently drop that line. Preserved verbatim, unrelated to
// whatever theme values change.
function parseBareDecls(body: string): string[] {
  return body.replace(/--[\w-]+\s*:\s*[^;}]+;?/g, '')
    .split(';').map(s => s.trim()).filter(Boolean)
}

/** Read the app's theme out of its src/index.css. Missing block → empty theme. */
export function parseAppTheme(indexCss: string): AppTheme {
  const block = rootBlock(indexCss ?? '')
  if (!block) return { tokens: {} }
  const decls = parseDecls(block.body)
  const tokens: Record<string, string> = {}
  for (const [name, value] of Object.entries(decls)) {
    if (name === 'radius' || name.startsWith('font-')) continue
    tokens[name] = value
  }
  return {
    tokens,
    radius: decls['radius'],
    fontSans: decls['font-sans'] ? strip(decls['font-sans']) : undefined,
    fontDisplay: decls['font-display'] ? strip(decls['font-display']) : undefined,
    fontMono: decls['font-mono'] ? strip(decls['font-mono']) : undefined,
  }
}

function serializeRootBody(theme: AppTheme, preserved: Record<string, string>): string {
  const lines: string[] = []
  const written = new Set<string>()
  const push = (name: string, value: string | undefined) => {
    if (value === undefined || written.has(name)) return
    written.add(name)
    lines.push(`  --${name}: ${value};`)
  }
  for (const t of COLOR_TOKENS) push(t, theme.tokens[t] ?? preserved[t])
  // any extra tokens the app defined (charts, gradients…) survive the rewrite
  for (const [name, value] of Object.entries({ ...preserved, ...theme.tokens })) {
    if (name === 'radius' || name.startsWith('font-')) continue
    push(name, value)
  }
  push('radius', theme.radius ?? preserved['radius'])
  push('font-sans', theme.fontSans ? `'${theme.fontSans}'` : preserved['font-sans'])
  push('font-display', theme.fontDisplay ? `'${theme.fontDisplay}'` : preserved['font-display'])
  push('font-mono', theme.fontMono ? `'${theme.fontMono}'` : preserved['font-mono'])
  return lines.join('\n')
}

/** Rewrite one selector's block (:root or .dark) in place with the given
 *  theme, preserving whatever declarations the theme doesn't cover. Returns
 *  the unmodified css if the block isn't present — callers decide whether
 *  that's expected (:root always gets created; .dark only rewritten if the
 *  project already has one, see writeAppTheme). */
function rewriteBlock(css: string, block: { body: string; start: number; end: number }, selector: string, theme: AppTheme): string {
  const preserved = parseDecls(block.body)
  applyLegacyTokenOverlay(preserved, theme)
  const bare = parseBareDecls(block.body)
  const varLines = serializeRootBody(theme, preserved)
  const nextBlock = `${selector} {\n${varLines}${bare.length ? '\n' + bare.map(d => `  ${d};`).join('\n') : ''}\n}`
  return css.slice(0, block.start) + nextBlock + css.slice(block.end)
}

/**
 * Rewrite src/index.css's :root{} block with the given theme. Declarations the
 * theme doesn't cover are preserved; everything outside the block is untouched.
 * No :root block → one is prepended (after any @tailwind directives).
 *
 * If the project also defines a .dark{} override (from a prior "Add dark
 * mode" edit — see darkBlock's comment for why this matters), that block is
 * rewritten with the SAME theme values too, so the app looks themed
 * regardless of which mode is currently active. Never CREATES a .dark block
 * that wasn't already there — a project with no dark mode stays that way.
 */
export function writeAppTheme(indexCss: string, theme: AppTheme): string {
  let css = indexCss ?? ''

  const dark = darkBlock(css)
  if (dark) css = rewriteBlock(css, dark, '.dark', theme)

  // Re-find :root — darkBlock may have shifted every later offset.
  const root = rootBlock(css)
  if (root) return rewriteBlock(css, root, ':root', theme)

  const preserved: Record<string, string> = {}
  applyLegacyTokenOverlay(preserved, theme)
  const newBlock = `:root {\n${serializeRootBody(theme, preserved)}\n}`
  const lastDirective = css.lastIndexOf('@tailwind')
  if (lastDirective !== -1) {
    const lineEnd = css.indexOf('\n', lastDirective)
    const at = lineEnd === -1 ? css.length : lineEnd + 1
    return css.slice(0, at) + '\n' + newBlock + '\n' + css.slice(at)
  }
  return `${newBlock}\n${css}`
}

/** CSS for the preview's instant `wyber-apply-theme` override (no rebuild). */
export function themeToCss(theme: AppTheme): string {
  const lines: string[] = []
  for (const [name, value] of Object.entries(theme.tokens)) lines.push(`  --${name}: ${value};`)
  // Also emit the legacy prebuilt-template token names (--bg/--accent/--text/…,
  // see LEGACY_TOKEN_MAP) wrapped in hsl() — those templates read colors via
  // these var names directly, not the shadcn set above. A no-op on
  // from-scratch projects, which never reference these names.
  const legacyOverlay: Record<string, string> = {}
  applyLegacyTokenOverlay(legacyOverlay, theme)
  for (const [name, value] of Object.entries(legacyOverlay)) lines.push(`  --${name}: ${value};`)
  if (theme.radius) lines.push(`  --radius: ${theme.radius};`)
  if (theme.fontSans) lines.push(`  --font-sans: '${theme.fontSans}';`)
  if (theme.fontDisplay) lines.push(`  --font-display: '${theme.fontDisplay}';`)
  if (theme.fontMono) lines.push(`  --font-mono: '${theme.fontMono}';`)
  const body = lines.join('\n')
  // Also override .dark with the identical values — same reasoning as
  // writeAppTheme: a project with "Add dark mode" applied has its own .dark
  // block, which otherwise wins the cascade over :root while dark mode is
  // active, making the instant preview look like nothing happened. This
  // <style> tag is upserted after the app's own stylesheet, so on the
  // matching .dark selector it wins by source order at equal specificity.
  return `:root {\n${body}\n}\n.dark {\n${body}\n}\nbody { font-family: var(--font-sans), ui-sans-serif, system-ui, sans-serif; }`
}

/** A palette from Session B's catalog, as an applicable theme. */
export function paletteToTheme(pal: Palette): AppTheme {
  return {
    tokens: { ...pal.tokens },
    radius: pal.radius,
    fontSans: pal.fontSans,
    fontDisplay: pal.fontDisplay,
  }
}

// ── Neutral scaffolds (dark/light) for the custom builder ─────────────────
// Values mirror design-system.ts TOKEN_VARS_CSS so "start from dark/light"
// always matches the platform's safety-net defaults.

export const DARK_SCAFFOLD: Record<string, string> = {
  background: '240 10% 3.9%', foreground: '0 0% 98%',
  card: '240 10% 5.5%', 'card-foreground': '0 0% 98%',
  popover: '240 10% 5.5%', 'popover-foreground': '0 0% 98%',
  primary: '199 89% 48%', 'primary-foreground': '0 0% 100%',
  secondary: '240 3.7% 15.9%', 'secondary-foreground': '0 0% 98%',
  muted: '240 3.7% 15.9%', 'muted-foreground': '240 5% 64.9%',
  accent: '240 3.7% 15.9%', 'accent-foreground': '0 0% 98%',
  destructive: '0 62.8% 50.6%', 'destructive-foreground': '0 0% 98%',
  border: '240 3.7% 15.9%', input: '240 3.7% 15.9%', ring: '199 89% 48%',
}

export const LIGHT_SCAFFOLD: Record<string, string> = {
  background: '0 0% 100%', foreground: '240 10% 3.9%',
  card: '0 0% 100%', 'card-foreground': '240 10% 3.9%',
  popover: '0 0% 100%', 'popover-foreground': '240 10% 3.9%',
  primary: '199 89% 48%', 'primary-foreground': '0 0% 100%',
  secondary: '240 4.8% 95.9%', 'secondary-foreground': '240 5.9% 10%',
  muted: '240 4.8% 95.9%', 'muted-foreground': '240 3.8% 46.1%',
  accent: '240 4.8% 95.9%', 'accent-foreground': '240 5.9% 10%',
  destructive: '0 84.2% 60.2%', 'destructive-foreground': '0 0% 98%',
  border: '240 5.9% 90%', input: '240 5.9% 90%', ring: '240 5.9% 10%',
}

// ── HSL channel ↔ hex (for <input type="color"> pickers) ──────────────────

/** "199 89% 48%" → "#0ea5e9"-style hex. Invalid input → #000000. */
export function hslChannelsToHex(channels: string): string {
  const m = (channels ?? '').trim().match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/)
  if (!m) return '#000000'
  const h = parseFloat(m[1]) / 360, s = parseFloat(m[2]) / 100, l = parseFloat(m[3]) / 100
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  let r: number, g: number, b: number
  if (s === 0) { r = g = b = l }
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3)
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/** "#0ea5e9" → "199 89% 48%"-style HSL channels. Invalid input → "0 0% 0%". */
export function hexToHslChannels(hex: string): string {
  const m = (hex ?? '').trim().match(/^#?([0-9a-f]{6})$/i)
  if (!m) return '0 0% 0%'
  const n = parseInt(m[1], 16)
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}
