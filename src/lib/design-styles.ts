// Curated "Design" tab styles — hero/button/card/nav treatments a user can
// apply to an ALREADY-BUILT app, on demand, for credits. Distinct from
// design-palettes.ts (colors/fonts/radius, applied free via ThemePanel):
// these are structural/component swaps, so they go through a real AI edit
// turn (see DesignPanel.tsx), not a CSS string rewrite.
//
// `brief` is injected verbatim into the synthetic edit prompt dispatched via
// the wyber:chat-prompt event (same mechanism as Wyberman's click-to-edit
// and ConnectorsPanel) — it names the exact wyber-ui-kit export(s) to use so
// the model has a concrete target instead of inventing something from
// scratch, and explicitly scopes the edit so it doesn't rewrite unrelated
// files. Card and Nav map to existing kit components almost 1:1 (11 card
// wrappers, 6+ nav components already exist) so those should land reliably;
// Hero and Button are thinner in the kit (one full hero layout primitive,
// one button component with variant props) so those briefs ask the model to
// compose from smaller pieces — expect more visual variance there.

export interface DesignStyle {
  id: string
  category: 'hero' | 'button' | 'card' | 'nav'
  label: string
  description: string
  brief: string
}

export const DESIGN_CATEGORIES: { id: DesignStyle['category']; label: string }[] = [
  { id: 'hero', label: 'Hero' },
  { id: 'button', label: 'Buttons' },
  { id: 'card', label: 'Cards' },
  { id: 'nav', label: 'Navigation' },
]

const SCOPE_SUFFIX = 'Keep all existing copy, data, and functionality exactly as-is — only change the visual treatment described above. Do not modify any file unrelated to this.'

export const DESIGN_STYLES: DesignStyle[] = [
  // ── Hero ──────────────────────────────────────────────────────────────
  {
    id: 'hero-split-image',
    category: 'hero',
    label: 'Split Image',
    description: 'Two-column hero with a floating stat card overlay',
    brief: `Rebuild the app's hero section using the SplitHero component from wyber-ui-kit (import { SplitHero } from './wyber-ui'): headline + copy + CTA on one side, a visual (image, mockup, or illustrative graphic matching the app's subject) on the other, with a small floating stat/metric card overlapping the visual's corner. ${SCOPE_SUFFIX}`,
  },
  {
    id: 'hero-terminal',
    category: 'hero',
    label: 'Terminal',
    description: 'Code/CLI-style hero with a typewriter-animated terminal',
    brief: `Rebuild the app's hero section around TerminalFrame and Typewriter from wyber-ui-kit (import { TerminalFrame, Typewriter } from './wyber-ui'): headline + copy on one side, a terminal window on the other showing a short typewriter-animated sequence relevant to what this app does. ${SCOPE_SUFFIX}`,
  },
  {
    id: 'hero-bento',
    category: 'hero',
    label: 'Bento Grid',
    description: 'Headline over an asymmetric bento-grid of feature tiles',
    brief: `Rebuild the app's hero section as a large HeroHeadline (import { HeroHeadline, BentoGrid, BentoCard } from './wyber-ui') above an asymmetric BentoGrid of 4-5 BentoCard tiles, each highlighting a different real feature/section of the app. ${SCOPE_SUFFIX}`,
  },
  {
    id: 'hero-editorial',
    category: 'hero',
    label: 'Editorial',
    description: 'Oversized serif headline, magazine-style layout',
    brief: `Rebuild the app's hero section as an oversized editorial headline using HeroHeadline (import { HeroHeadline } from './wyber-ui') set in a large serif/display treatment, with a short standfirst paragraph below it and generous whitespace — magazine-cover feel rather than a typical SaaS hero. ${SCOPE_SUFFIX}`,
  },
  {
    id: 'hero-orbit',
    category: 'hero',
    label: 'Orbit',
    description: 'Centered headline with icons orbiting a central mark',
    brief: `Rebuild the app's hero section as a centered layout: headline + copy + CTA in the middle, with HeroOrbit (import { HeroOrbit } from './wyber-ui') placed above or behind it showing 4-6 relevant icons orbiting the app's logo/mark. ${SCOPE_SUFFIX}`,
  },

  // ── Buttons ───────────────────────────────────────────────────────────
  {
    id: 'button-neubrutalist',
    category: 'button',
    label: 'Neubrutalist',
    description: 'Thick borders, hard offset shadow, no blur',
    brief: `Restyle every primary button in this app: thick 2px solid border, a hard (non-blurred) offset drop-shadow (e.g. 4px 4px 0), no rounded corners, bold uppercase label text, and a "press" interaction where the shadow shrinks and the button shifts toward it on click. Apply this treatment everywhere the existing Button component from wyber-ui-kit is used, by adjusting its className/style. ${SCOPE_SUFFIX}`,
  },
  {
    id: 'button-glass',
    category: 'button',
    label: 'Glass',
    description: 'Frosted-glass blur with a soft inner highlight',
    brief: `Restyle every primary button in this app to a frosted-glass look: semi-transparent background with backdrop-blur, a subtle 1px light border, and a soft inner top highlight. Apply this everywhere the existing Button component from wyber-ui-kit is used, by adjusting its className/style. ${SCOPE_SUFFIX}`,
  },
  {
    id: 'button-gradient-pill',
    category: 'button',
    label: 'Gradient Pill',
    description: 'Fully rounded, gradient-filled, glowing on hover',
    brief: `Restyle every primary button in this app to a fully-rounded pill shape with a gradient fill (using the app's own primary/accent color tokens, not new colors) and a soft glow on hover. Apply this everywhere the existing Button component from wyber-ui-kit is used. ${SCOPE_SUFFIX}`,
  },
  {
    id: 'button-outline-minimal',
    category: 'button',
    label: 'Outline Minimal',
    description: 'Borderless, underline-on-hover, text-first',
    brief: `Restyle every primary button in this app to a minimal text-first treatment: no fill, no border by default, just the label with an arrow/chevron, and an animated underline or arrow-shift on hover. Apply this everywhere the existing Button component from wyber-ui-kit is used. ${SCOPE_SUFFIX}`,
  },
  {
    id: 'button-magnetic',
    category: 'button',
    label: 'Magnetic',
    description: 'Cursor-attraction effect on primary CTAs',
    brief: `Replace the app's main call-to-action button(s) — the hero CTA and any other primary "get started"-style button — with MagneticButton from wyber-ui-kit (import { MagneticButton } from './wyber-ui'), which pulls slightly toward the cursor on hover. Leave secondary/utility buttons as the regular Button component. ${SCOPE_SUFFIX}`,
  },

  // ── Cards ─────────────────────────────────────────────────────────────
  {
    id: 'card-holographic',
    category: 'card',
    label: 'Holographic',
    description: 'Iridescent sheen that shifts with cursor movement',
    brief: `Restyle every card in this app to use HolographicCard from wyber-ui-kit (import { HolographicCard } from './wyber-ui') instead of the current Card. Keep all existing content/props — only change the wrapping component. ${SCOPE_SUFFIX}`,
  },
  {
    id: 'card-tilt',
    category: 'card',
    label: 'Tilt',
    description: '3D tilt that follows the cursor',
    brief: `Restyle every card in this app to use TiltCard from wyber-ui-kit (import { TiltCard } from './wyber-ui') instead of the current Card. Keep all existing content/props — only change the wrapping component. ${SCOPE_SUFFIX}`,
  },
  {
    id: 'card-clay',
    category: 'card',
    label: 'Clay',
    description: 'Soft neumorphic raised/pressed surfaces',
    brief: `Restyle every card in this app to use ClayCard from wyber-ui-kit (import { ClayCard } from './wyber-ui', tone="raised") instead of the current Card. Keep all existing content/props — only change the wrapping component. ${SCOPE_SUFFIX}`,
  },
  {
    id: 'card-glow-orb',
    category: 'card',
    label: 'Glow Orb',
    description: 'Soft colored light glowing from one corner',
    brief: `Restyle every card in this app to use GlowOrbCard from wyber-ui-kit (import { GlowOrbCard } from './wyber-ui') instead of the current Card. Keep all existing content/props — only change the wrapping component. ${SCOPE_SUFFIX}`,
  },
  {
    id: 'card-notch',
    category: 'card',
    label: 'Notch',
    description: 'Cut-corner notch detail, technical/precise feel',
    brief: `Restyle every card in this app to use NotchCard from wyber-ui-kit (import { NotchCard } from './wyber-ui') instead of the current Card. Keep all existing content/props — only change the wrapping component. ${SCOPE_SUFFIX}`,
  },
  {
    id: 'card-stacked-depth',
    category: 'card',
    label: 'Stacked Depth',
    description: 'Layered cards peeking out from behind each other',
    brief: `Restyle the app's card-based sections to use StackedDepthCards from wyber-ui-kit (import { StackedDepthCards } from './wyber-ui') so related cards appear layered with depth instead of in a flat grid. Keep all existing content — only change the layout/wrapping component. ${SCOPE_SUFFIX}`,
  },

  // ── Navigation ────────────────────────────────────────────────────────
  {
    id: 'nav-floating-dock',
    category: 'nav',
    label: 'Floating Dock',
    description: 'macOS-style floating dock with magnification',
    brief: `Replace the app's current navigation with FloatingDockNav from wyber-ui-kit (import { FloatingDockNav } from './wyber-ui') — a floating, magnifying dock-style nav — keeping the same links/routes. ${SCOPE_SUFFIX}`,
  },
  {
    id: 'nav-pill-tabs',
    category: 'nav',
    label: 'Pill Tabs',
    description: 'Rounded pill-shaped tab switcher',
    brief: `Replace the app's current navigation with PillTabNav from wyber-ui-kit (import { PillTabNav } from './wyber-ui') — a rounded pill-shaped tab bar — keeping the same links/routes. ${SCOPE_SUFFIX}`,
  },
  {
    id: 'nav-sidebar',
    category: 'nav',
    label: 'Sidebar',
    description: 'Collapsible left sidebar instead of a top bar',
    brief: `Replace the app's current top navigation with SidebarNav from wyber-ui-kit (import { SidebarNav } from './wyber-ui') — a collapsible left sidebar — keeping the same links/routes, and adjust the main content layout to accommodate the sidebar. ${SCOPE_SUFFIX}`,
  },
  {
    id: 'nav-condensing',
    category: 'nav',
    label: 'Condensing',
    description: 'Shrinks and compacts on scroll',
    brief: `Replace the app's current navigation with CondensingNavbar from wyber-ui-kit (import { CondensingNavbar } from './wyber-ui') — a navbar that shrinks/condenses once the user scrolls — keeping the same links/routes. ${SCOPE_SUFFIX}`,
  },
  {
    id: 'nav-mega-menu',
    category: 'nav',
    label: 'Mega Menu',
    description: 'Expanded dropdown with grouped sections',
    brief: `Replace the app's current navigation with MegaMenu from wyber-ui-kit (import { MegaMenu } from './wyber-ui') for any nav item that has sub-items, grouping related links into sections. Keep top-level links that have no sub-items as plain nav links. ${SCOPE_SUFFIX}`,
  },
]

export function getStylesByCategory(category: DesignStyle['category']): DesignStyle[] {
  return DESIGN_STYLES.filter(s => s.category === category)
}

export function getDesignStyleById(id: string): DesignStyle | undefined {
  return DESIGN_STYLES.find(s => s.id === id)
}
