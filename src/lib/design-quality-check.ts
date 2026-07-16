// Heuristic-only, non-blocking check for whether a fresh build looks
// generic. This is deliberately isolated from the crash-prevention pipeline:
// it imports nothing from sanitize-files.ts or stub-missing-imports.ts, and
// nothing here can gate, delay, or trigger a regeneration — it only ever
// produces an optional suggestion the caller may choose to surface.

type FileVal = { content?: string; language?: string } | string;

const contentOf = (v: FileVal | undefined): string =>
  typeof v === 'string' ? v : (v?.content ?? '');

// Written by stub-missing-imports.ts for a truncated/never-emitted file — a
// self-heal placeholder must never be miscounted as bad design, so any file
// starting with this marker is skipped entirely.
const AUTO_STUB_MARKER = '// Auto-stub:';

// Same color family wyber-ui-kit.test.ts already bans from the kit's own
// source — scoring compliance with a rule the model is already told to
// follow, not inventing new taste.
const BANNED_CLASS_RE = /\b(?:bg|text|border|ring|from|to|via)-(?:zinc|slate|gray|neutral|stone|indigo|blue|red|green|amber|violet|purple|pink|rose|emerald|teal|cyan|sky|orange|lime|yellow|fuchsia)-\d+\b/g;
const BANNED_HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
const BANNED_RGB_RE = /\brgba?\(/g;

// The semantic classes design-palettes.ts's renderDesignBrief() tells every
// fresh build to use (bg-primary, text-foreground, border-border, etc).
const SEMANTIC_CLASS_RE = /\b(?:bg|text|border|ring)-(?:background|foreground|card|card-foreground|popover|popover-foreground|primary|primary-foreground|secondary|secondary-foreground|muted|muted-foreground|accent|accent-foreground|destructive|destructive-foreground|border|input|ring)\b/g;

// wyber-ui-kit.ts's exported layout/motion primitives.
const KIT_COMPONENTS = [
  'Reveal', 'Stagger', 'StaggerItem', 'AnimatedNumber', 'Marquee', 'ScrollProgress', 'Parallax',
  'SplitTextReveal', 'StickyShowcase', 'ScrollStack', 'TiltCard', 'LiquidUnderline', 'SpotlightCard',
  'GradientBorder', 'NoiseOverlay', 'HeroHeadline', 'AuroraBackground', 'BackgroundGrid',
  'SectionHeading', 'BentoGrid', 'BentoCard', 'FeatureCard', 'StatBlock', 'TestimonialCard',
  'PricingCard', 'CTASection', 'MonoLabel', 'SectionNumber', 'EditorialHeadline', 'HairlineFrame',
  'MediaFrame', 'PinnedStory', 'DataRow', 'CursorGlow', 'GlassPanel',
];

export interface DesignSuggestion { note: string; prompt: string; label: string }

/**
 * Static, heuristic-only genericness check for a fresh WEB build. Never
 * called for mobile (React Native styling isn't Tailwind classes, so none
 * of these signals apply) or for incremental edits — callers are expected
 * to gate on "this is a first build" before calling this.
 *
 * Conservative by design: each signal only contributes when it's clearly
 * bad, and at least two of three must fire before a suggestion is returned.
 * A false "looks generic" on a genuinely good build is worse than an
 * occasional miss.
 */
export function assessDesignFreshness(files: Record<string, FileVal>, projectType?: string): DesignSuggestion | null {
  if (projectType === 'mobile') return null;

  let bannedHits = 0;
  let semanticHits = 0;
  let bareDivCount = 0;
  let scannedFiles = 0;
  const kitSeen = new Set<string>();

  for (const [path, val] of Object.entries(files ?? {})) {
    if (!/\.(tsx|jsx|css)$/i.test(path)) continue;
    const content = contentOf(val);
    if (!content || content.startsWith(AUTO_STUB_MARKER)) continue;
    scannedFiles++;

    bannedHits += (content.match(BANNED_CLASS_RE) ?? []).length;
    bannedHits += (content.match(BANNED_HEX_RE) ?? []).length;
    bannedHits += (content.match(BANNED_RGB_RE) ?? []).length;
    semanticHits += (content.match(SEMANTIC_CLASS_RE) ?? []).length;

    if (/\.(tsx|jsx)$/i.test(path)) {
      bareDivCount += (content.match(/<div\b/g) ?? []).length;
      for (const name of KIT_COMPONENTS) {
        if (kitSeen.has(name)) continue;
        if (new RegExp(`<${name}\\b`).test(content)) kitSeen.add(name);
      }
    }
  }

  if (scannedFiles === 0) return null;

  let flags = 0;
  if (bannedHits >= 3) flags++;
  if (bannedHits > 0 && semanticHits === 0) flags++;
  if (kitSeen.size <= 1 && bareDivCount >= 8) flags++;

  if (flags < 2) return null;

  return {
    note: "This build leans on generic Tailwind grays and plain divs instead of the app's own palette and layout components — want a fresher pass?",
    prompt: 'Restyle this using only the semantic design tokens already in src/index.css (bg-primary, bg-card, text-foreground, etc — no raw gray/zinc/slate classes or hex colors), and use more of the Wyber UI Kit layout components (BentoGrid, GlassPanel, SpotlightCard, EditorialHeadline, etc) instead of plain divs where it makes sense.',
    label: '✨ Make this look fresher',
  };
}
