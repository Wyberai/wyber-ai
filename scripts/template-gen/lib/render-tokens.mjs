// Renders a design-palettes.ts Palette object into the exact src/index.css
// shape a real generation produces — same token order as renderDesignBrief()
// in src/lib/design-palettes.ts, and reuses the real BASE_LAYER_CSS /
// GOOGLE_FONTS_LINKS constants from src/lib/design-system.ts rather than
// re-deriving the font-loading convention by hand.

const TOKEN_ORDER = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
  'primary', 'primary-foreground', 'secondary', 'secondary-foreground',
  'muted', 'muted-foreground', 'accent', 'accent-foreground',
  'destructive', 'destructive-foreground', 'border', 'input', 'ring',
]

export function paletteRootCss(pal) {
  const lines = TOKEN_ORDER
    .filter((k) => pal.tokens[k])
    .map((k) => `  --${k}: ${pal.tokens[k]};`)
    .join('\n')
  // Brand flourish vars — real generate/route.ts mandates these for gradient-
  // border cards/inputs and the active-sidebar glow (SaaS DESIGN SYSTEM section).
  const accent = pal.tokens.accent || pal.tokens.primary
  const flourish = [
    `  --gradient-active: linear-gradient(135deg, hsl(${pal.tokens.primary} / 0.15), hsl(${accent} / 0.1));`,
    `  --gradient-hero: linear-gradient(135deg, hsl(${pal.tokens.primary}), hsl(${accent}));`,
    `  --shadow-glow: 0 0 20px hsl(${pal.tokens.primary} / 0.3);`,
  ].join('\n')
  return `:root {\n  --radius: ${pal.radius};\n  --font-sans: '${pal.fontSans}';\n  --font-display: '${pal.fontDisplay}';\n${lines}\n${flourish}\n}`
}

// Noise grain texture — real generate/route.ts DESIGN section calls this
// "Aug 2026 essential" for dark hero/auth panels; used by the auth screens'
// cinematic left panel (className="... grain").
const GRAIN_CSS = `
@keyframes grain { 0%,100%{transform:translate(0,0)} 10%{transform:translate(-2%,-3%)} 20%{transform:translate(3%,2%)} 30%{transform:translate(-1%,4%)} 40%{transform:translate(2%,-2%)} 50%{transform:translate(-3%,1%)} 60%{transform:translate(1%,3%)} 70%{transform:translate(-2%,0)} 80%{transform:translate(3%,-1%)} 90%{transform:translate(-1%,2%)} }
.grain { position: relative; }
.grain::after { content:''; position:absolute; inset:-50%; width:200%; height:200%; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E"); opacity:0.04; animation:grain 8s steps(10) infinite; pointer-events:none; }
`

export function indexCssFor(pal, baseLayerCss, extraCss = '') {
  return `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n${paletteRootCss(pal)}\n\n${baseLayerCss}\n${pal.mode === 'dark' ? '\nhtml { color-scheme: dark; }\n' : ''}${GRAIN_CSS}${extraCss}`
}
