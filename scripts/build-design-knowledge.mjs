#!/usr/bin/env node
// Builds src/lib/design-knowledge.ts from the GitHub design corpus (research/github-design-corpus, commit d7c1404).
//
//   git show research/github-design-corpus:docs/github-design-corpus/corpus.jsonl > corpus.jsonl
//   node scripts/build-design-knowledge.mjs corpus.jsonl
//
// Only aggregate counts leave this script: font names, hue families, token/section/component NAMES and how many repos show each.
// No repo names, no source code, no copy, no layouts. Every entry carries the number of repos behind it, and the denominator,
// so the generators can weigh thin evidence as thin.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const input = process.argv[2] || 'docs/github-design-corpus/corpus.jsonl'
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'lib', 'design-knowledge.ts')
const rows = fs.readFileSync(input, 'utf8').trim().split('\n').map(l => JSON.parse(l))

const CANON = { 'jetbrains mono': 'JetBrains Mono', 'source-code-pro': 'Source Code Pro', 'source code pro': 'Source Code Pro', geistsans: 'Geist', geistmono: 'Geist Mono', 'inter variable': 'Inter', 'ibm plex mono': 'IBM Plex Mono', 'ibm plex sans': 'IBM Plex Sans', 'dm sans': 'DM Sans', 'dm mono': 'DM Mono', 'roboto mono': 'Roboto Mono' }
const canon = f => { const g = f.replace(/\s+Variable$/i, '').trim(); return CANON[g.toLowerCase()] ?? g }
const isMono = f => /mono|code|courier/i.test(f)
const NOISE = /octicons|^icon|awesome|material|symbols|emoji|^var\(/i

const tally = (map, k) => map.set(k, (map.get(k) ?? 0) + 1)
const top = (map, n, min = 1) => [...map.entries()].filter(([, c]) => c >= min).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n).map(([key, repos]) => ({ key, repos }))

const fonts = new Map(), monos = new Map(), pairs = new Map(), hues = new Map(), theme = new Map(), radius = new Map(), hero = new Map()
const sections = new Map(), nav = new Map(), comps = new Map(), libs = new Map(), tw = new Map()
const bizHue = {}, bizSections = {}, bizN = {}, bizFonts = {}
let nFontRepos = 0, nPair = 0, nHue = 0, nTheme = 0, nRadius = 0, nHero = 0, nNav = 0, nSections = 0

for (const r of rows) {
  const fl = [...new Set((r.fonts || []).map(canon).filter(f => !NOISE.test(f)))]
  if (fl.length) { nFontRepos++; fl.forEach(f => tally(fonts, f)); fl.filter(isMono).forEach(f => tally(monos, f)) }
  if (fl.length >= 2 && fl.length <= 3) {
    nPair++
    const nm = fl.filter(f => !isMono(f)).sort()
    if (nm.length === 2) tally(pairs, nm.join(' + '))
  }
  if (r.tokens?.primaryHue) { nHue++; tally(hues, r.tokens.primaryHue) }
  if (r.tokens?.defaultTheme) { nTheme++; tally(theme, r.tokens.defaultTheme) }
  const rv = (r.tokens?.radius || [])[0]
  if (rv) {
    const m = String(rv).match(/^([\d.]+)(rem|px)/)
    if (m) { const px = +m[1] * (m[2] === 'rem' ? 16 : 1); nRadius++; tally(radius, px <= 4 ? 'sharp (4px or less)' : px <= 10 ? 'standard (5 to 10px)' : 'soft (12px or more)') }
  }
  if ((r.heroVariants || []).length) { nHero++; for (const h of new Set(r.heroVariants)) tally(hero, h) }
  const nv = Object.keys(r.navigation || {}); if (nv.length) nNav++; nv.forEach(k => tally(nav, k))
  const sk = Object.keys(r.sections || {}); if (sk.length) nSections++; sk.forEach(k => tally(sections, k))
  Object.keys(r.components || {}).forEach(k => tally(comps, k))
  for (const l of r.stack?.uiLibs || []) tally(libs, l)
  if (r.stack?.tailwind) tally(tw, r.stack.tailwind)
  for (const b of r.business || []) {
    bizN[b] = (bizN[b] ?? 0) + 1
    if (r.tokens?.primaryHue) (bizHue[b] ??= new Map(), tally(bizHue[b], r.tokens.primaryHue))
    ;(bizSections[b] ??= new Map())
    sk.forEach(k => tally(bizSections[b], k))
    ;(bizFonts[b] ??= new Map())
    fl.filter(f => !isMono(f)).forEach(f => tally(bizFonts[b], f))
  }
}

// Business types with enough analysed repos to say anything. Palette claims need their own, much smaller, denominator.
const byBusiness = {}
for (const [b, n] of Object.entries(bizN)) {
  if (['unclassified', 'design system / ui library'].includes(b) || n < 50) continue
  const hn = [...(bizHue[b]?.values() ?? [])].reduce((a, c) => a + c, 0)
  byBusiness[b] = { repos: n, hueRepos: hn, primaryHue: top(bizHue[b] ?? new Map(), 6), sections: top(bizSections[b], 8), fonts: top(bizFonts[b], 5, 3) }
}

const data = {
  source: {
    corpus: 'GitHub design corpus, 3,903 public open-licensed repos analysed (collector commit d7c1404, collected 2026-11-19)',
    repos: rows.length,
    note: 'Aggregate counts only: font names, hue families, token, section and component NAMES. No source code, copy or layout was read into the generators.',
  },
  denominators: { repos: rows.length, withFonts: nFontRepos, withTwoOrThreeFonts: nPair, withPrimaryToken: nHue, withBackgroundToken: nTheme, withRadius: nRadius, withHeroVariant: nHero, withNavigation: nNav, withLandingSections: nSections },
  fonts: top(fonts, 30, 5),
  monoFaces: top(monos, 10, 3),
  pairingsWithoutMono: top(pairs, 12, 3),
  primaryHue: top(hues, 12),
  defaultTheme: top(theme, 3),
  radiusTier: top(radius, 3),
  heroVariants: top(hero, 10),
  navigation: top(nav, 10),
  landingSections: top(sections, 20),
  components: top(comps, 20),
  uiAndMotionLibs: top(libs, 14, 20),
  tailwind: top(tw, 4),
  byBusiness,
  limits: [
    'Palette-by-industry: only saas, agency, ai, fintech, portfolio and blog have 20+ repos with a readable primary colour. Healthcare has 7, restaurants 4, legal 1: no industry palette is claimed for them.',
    'Section ORDER by site type cannot be derived: the collector recorded which section names exist in a repo, not their sequence. Counts say which sections are common, not where they go.',
    'Motion techniques cannot be derived: only the presence of motion libraries (framer-motion, three, reanimated) was recorded, not what they animate.',
    'Spacing scales: only 65 repos override the Tailwind scale, which is too few to prefer one; the radius tier is the only scale used.',
    'Hero variants come from file names in 66 repos; weak evidence, used only as a mild nudge.',
    'The sample is design-forward public repos (templates, UI libraries, SaaS starters), skewed to developer tooling and to higher star counts; it is not a sample of small-business sites.',
    'Hue family uses the collector classifier (neutral = very low saturation or very dark/light); only repos that expose a readable --primary count.',
  ],
}

// one entry per line keeps the generated file small and reviewable
const compact = d => JSON.stringify(d, null, 2).replace(/\{\s+"key": ("[^"]*"),\s+"repos": (\d+)\s+\}/g, '{ "key": $1, "repos": $2 }')

const body = `// GENERATED by scripts/build-design-knowledge.mjs from the GitHub design corpus. Do not edit by hand; re-run the script.
// Every entry is { key, repos }: how many analysed repos show it. Read the denominators and the limits before relying on any of it.
// Patterns and statistics only: nothing here is third-party code, copy or layout.

export interface Support { key: string; repos: number }
export interface BusinessKnowledge { repos: number; hueRepos: number; primaryHue: Support[]; sections: Support[]; fonts: Support[] }

export const DESIGN_KNOWLEDGE = ${compact(data)} as const satisfies {
  source: { corpus: string; repos: number; note: string }
  denominators: Record<string, number>
  fonts: readonly Support[]; monoFaces: readonly Support[]; pairingsWithoutMono: readonly Support[]
  primaryHue: readonly Support[]; defaultTheme: readonly Support[]; radiusTier: readonly Support[]
  heroVariants: readonly Support[]; navigation: readonly Support[]; landingSections: readonly Support[]
  components: readonly Support[]; uiAndMotionLibs: readonly Support[]; tailwind: readonly Support[]
  byBusiness: Record<string, BusinessKnowledge>
  limits: readonly string[]
}
`
fs.writeFileSync(out, body)
console.log('wrote', out, body.length, 'bytes;', rows.length, 'repos;', nHue, 'with a primary colour')
