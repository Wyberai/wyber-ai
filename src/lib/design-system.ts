// Shared design-system contract used by BOTH the in-browser preview engine
// (Tailwind Play CDN) and the publish path (compiled `vite build` via
// sanitize-files). The two Tailwind engines must agree on token NAMES so an app
// looks identical in preview and after publish. Only the token VALUES change per
// app — the model defines them in src/index.css, which makes every app bespoke
// while staying cohesive.
//
// Convention (shadcn/Lovable): semantic token names are FIXED; each app sets HSL
// channel values on :root (and .dark). Tailwind maps the names → classes
// (bg-primary, text-foreground, border-border, …). Components NEVER hardcode
// literal colors — the only colors are these tokens.

// Curated font menu. Loaded once in the preview shell and in the synthesized
// index.html so any app can pick fonts via --font-sans / --font-display with no
// build-breaking @import. Keep this list and the token defaults in sync.
// Brand fonts (General Sans + Switzer) come from Fontshare's CDN — cross-origin
// friendly like Google Fonts, so they load in every generated/published app, not
// just on wyberai.com. Playfair Display + Lora (editorial/luxury display) and
// JetBrains Mono come from Google. This keeps generated apps ON-BRAND with the
// same premium typography as the platform, instead of the generic Inter/Sora
// "AI-SaaS" pairing.
export const GOOGLE_FONTS_LINKS = `<link rel="preconnect" href="https://api.fontshare.com" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700,800&f[]=switzer@400,500,600,700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700;800&family=Lora:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">`

// Default token values — a clean, accessible light theme (+ matching dark) used
// only as a SAFETY NET when an app forgets to define tokens, so nothing ever
// ships unstyled. Real apps override every value in src/index.css.
export const TOKEN_VARS_CSS = `:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 240 5.9% 10%;
  --radius: 0.75rem;
  --font-sans: 'Switzer';
  --font-display: 'General Sans';
  --font-mono: 'JetBrains Mono';
}
.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --card: 240 10% 5.5%;
  --card-foreground: 0 0% 98%;
  --popover: 240 10% 5.5%;
  --popover-foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;
  --secondary: 240 3.7% 15.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 50.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
  --ring: 240 4.9% 83.9%;
}`

// Base rules that wire the tokens to the page. Plain CSS (no @apply) so it
// compiles in both engines.
export const BASE_LAYER_CSS = `* { border-color: hsl(var(--border)); }
body { background-color: hsl(var(--background)); color: hsl(var(--foreground)); font-family: var(--font-sans, 'Switzer', ui-sans-serif, system-ui, sans-serif); -webkit-font-smoothing: antialiased; }`

// Full default block injected into index.css as a fallback when tokens are absent.
export const DEFAULT_TOKENS_CSS = `${TOKEN_VARS_CSS}\n${BASE_LAYER_CSS}`

// The theme.extend object — the SINGLE source of truth shared by the preview
// inline config and the generated tailwind.config.js. Written as a JS-literal
// string so it can be embedded verbatim in both places.
const THEME_EXTEND = `{
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'Inter', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.97)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out both',
        'scale-in': 'scale-in 0.2s ease-out both',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    }`

// Inline config for the Tailwind Play CDN (preview). Assigned to `tailwind.config`
// AFTER the CDN script loads.
export const PREVIEW_TAILWIND_CONFIG = `{ darkMode: 'class', theme: { extend: ${THEME_EXTEND} } }`

// tailwind.config.js file written on the publish path (compiled build). Keeps the
// content globs sanitize-files has always shipped so the PostCSS pass finds classes.
export const TAILWIND_CONFIG_FILE = `/** Auto-provided by WyberAi — maps semantic design tokens (defined in src/index.css) to Tailwind classes. */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: { center: true, padding: '1.5rem', screens: { '2xl': '1400px' } },
    extend: ${THEME_EXTEND},
  },
  plugins: [],
}
`
