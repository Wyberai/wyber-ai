/**
 * WyberAi brand tokens — JS mirror of src/styles/brand.css.
 *
 * FROZEN after the Phase-0 coordination commit (July 2026 overhaul).
 * Sessions A and C both consume these; keep values byte-identical to the
 * CSS custom properties in brand.css.
 */

export const BRAND = {
  bg: '#05060a',
  bgRaised: '#0a0c14',
  bgOverlay: '#10131f',

  accent: '#0ea5e9',
  accentHot: '#38bdf8',
  accentDim: '#0369a1',
  glow: 'rgba(14, 165, 233, 0.35)',
  glowSoft: 'rgba(14, 165, 233, 0.15)',

  text: '#e6edf6',
  textDim: '#8b94a7',
  textFaint: '#545c6e',

  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',
  borderAccent: 'rgba(14, 165, 233, 0.4)',

  mono: "'JetBrains Mono', ui-monospace, 'Cascadia Code', Menlo, monospace",
  sans: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",

  durFast: '150ms',
  durBase: '240ms',
  durSlow: '420ms',
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
  easeSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',

  noise:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
} as const;

export type BrandTokens = typeof BRAND;
