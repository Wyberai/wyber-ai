// QUIET CRAFT for the three legacy build prompts (website, SaaS, web app) in src/app/api/generate/route.ts.
//
// Why this exists (19 Nov 2026): those prompts were written for a flashier style (aurora, mesh, glow, glass, gradient borders, 3D tilt,
// parallax, cinematic sign-in panels, "every hero needs a kinetic moment"). The newer anti-slop rules and design directions are appended at
// the END and say the opposite, and the model resolves the conflict by ignoring the Wyber UI kit and writing its own header, FAQ and footer
// (0 of 5 live test builds imported the kit; the self-check then had to remove gradients, orbs and blur from the first draft).
// For launch-ready builds we now (1) put the quiet-craft rules FIRST, where they cannot be missed, and (2) cut the website sections that are
// purely about effects. Everything else in the legacy prompts (tech stack, SEO, boilerplate, robustness, copy, file structure) is kept.
//
// Applied only when the launch-ready flag for the project type is on, so with the flags off nothing changes. Fail-soft: a marker that is no
// longer found is skipped (and reported in `missed`) instead of breaking a build; quiet-prompt.test.ts fails loudly if that ever happens.

const SEP = '━'.repeat(40)
const RULE = /^━{10,}$/

export const QUIET_CRAFT_OVERRIDE = `${SEP}
QUIET CRAFT — READ THIS FIRST. IT OVERRIDES EVERY OLDER STYLE INSTRUCTION BELOW.
${SEP}
This build is designed from its DESIGN DIRECTION and built from the Wyber UI kit's structural components. The older sections further down were written for a flashier style. Where they conflict with this block, THIS BLOCK WINS, and a build that follows the older text where it conflicts is wrong.
DO NOT USE, even where a section below asks for it: gradients of any kind (backgrounds, text, borders, scrims, active states), glow or coloured shadows, glassmorphism or backdrop blur, mesh, aurora, orbs, blobs, noise or grain overlays, holographic or 3D-tilt cards, parallax, pinned or cinematic scroll sequences, marquees and tickers, cursor effects, decorative animated counters, emoji as icons, and a cinematic image panel on sign-in screens.
INSTEAD: flat surfaces from the tokens; 1px borders; one shadow level at most; a flat tint (never a gradient) when text sits on an image; active states as a solid tint plus a clear label; sign-in screens are a quiet form with the product name; images only where they show the real thing.
STRUCTURE: import navigation, footer, section headings, cards, forms, tables, tabs, dialogs, toasts, accordions, pricing, testimonials and stats from the Wyber UI kit's structural components (listed in the kit reference below). Do not hand-write equivalents.
MOTION: Reveal, Stagger and StaggerItem only, one quiet reveal per section.

`

export const QUIET_WEBSITE_COMPOSITION = `${SEP}
WEBSITE COMPOSITION — QUIET CRAFT (THE DESIGN DIRECTION GIVES THE LOOK)
${SEP}
Structure comes from the Wyber UI kit; the look comes from the DESIGN DIRECTION block. Do not add decoration the direction did not ask for.
- Navigation: kit <Navbar brand links cta> (or <CondensingNavbar>), solid background, no glass. Add pt-16 to the page.
- Hero: the headline says what the business does, for whom and where, in <HeroHeadline> or <EditorialHeadline>; one primary action; one real or clearly empty {{wyber-image}} slot in <MediaFrame>. Follow the direction's composition, not a generic archetype.
- Sections: only the ones this business needs, in the order a visitor decides: what you do, proof you were given, how to reach you, how it works or the price when given. Use <SectionHeading>, <FeatureCard> or <BentoGrid> with concrete copy, <StatBlock> only for real numbers, <TestimonialCard> only for real quotes, <PricingCard> only for prices the owner gave, <FAQAccordionIcon> for questions, <CTASection> to close, and the kit <Footer>.
- Forms: kit <Input>, <Textarea> and <Button>; the enquiry form follows the launch-ready contract below.
- Motion: <Reveal> and <Stagger> only. No parallax, pinned scroll sequences, cursor effects, marquees, aurora, mesh, glow, noise or glass.
- Persona switchers, interactive product demos and pinned walkthroughs belong to software marketing sites; a business website does not need them.

`

type Op =
  | { kind: 'line'; match: string; replacement?: string }                       // replace (or drop) the first line containing `match`
  | { kind: 'cut'; from: string; until: string; replacement?: string }          // cut the lines from the first `from` line up to (not including) the next `until` line
  | { kind: 'section'; from: string; until: string; replacement: string }       // like cut, but also takes the ━━━ rule above each heading with it

const WEBSITE_OPS: Op[] = [
  { kind: 'line', match: '- Signature: 1–2 distinctive touches (aurora hero', replacement: '- Signature: one or two touches that belong to THIS business (a real photograph, a specific diagram, oversized editorial type), never a trend effect' },
  { kind: 'cut', from: '- Brand flourishes (gradients, glows, grain, aurora)', until: '- Contrast is NON-NEGOTIABLE.' },
  { kind: 'cut', from: 'GRADIENT-BORDER CARD (for featured pricing', until: 'HERO IMAGE IS NON-NEGOTIABLE' },
  { kind: 'line', match: 'USE FOR: hero visual (wrap in <Parallax', replacement: 'USE FOR: hero visual, alternating feature images (in <MediaFrame>), team photos, editorial section images. When text sits on top of an image, use a flat tint, never a gradient scrim.' },
  { kind: 'section', from: 'WEBSITE COMPOSITION —', until: 'COPY RULES — CONVERSION-FIRST', replacement: QUIET_WEBSITE_COMPOSITION },
  { kind: 'line', match: '□ ONE cinematic scroll moment' },
  { kind: 'line', match: 'keyframes (grain, marquee, aurora) + brand flourish vars', replacement: '  index.css            — :root HSL channel tokens + the direction\'s fonts' },
]

// SaaS and web-app prompts are saturated with effect wording line by line (glow, gradient borders, glass, 3D tilt); a rewrite of each line is
// fragile, so those two rely on the override above plus the kit and anti-slop rules. Add section ops here when a whole section is safe to cut.
const OPS: Record<'website' | 'saas' | 'webapp', Op[]> = { website: WEBSITE_OPS, saas: [], webapp: [] }

export function opsFor(kind: 'website' | 'saas' | 'webapp'): readonly Op[] { return OPS[kind] }

export function quietenPrompt(base: string, kind: 'website' | 'saas' | 'webapp'): { text: string; missed: string[] } {
  let lines = base.split('\n')
  const missed: string[] = []
  const idx = (needle: string, from = 0) => lines.findIndex((l, i) => i >= from && l.includes(needle))
  for (const op of OPS[kind]) {
    if (op.kind === 'line') {
      const i = idx(op.match)
      if (i < 0) { missed.push(op.match); continue }
      if (op.replacement === undefined) lines.splice(i, 1)
      else lines[i] = op.replacement
    } else {
      let i = idx(op.from)
      if (i < 0) { missed.push(op.from); continue }
      let j = idx(op.until, i + 1)
      if (j < 0) { missed.push(op.until); continue }
      if (op.kind === 'section') {
        if (RULE.test(lines[i - 1] ?? '')) i -= 1
        if (RULE.test(lines[j - 1] ?? '')) j -= 1
      }
      lines.splice(i, j - i, ...(op.replacement ? op.replacement.replace(/\n$/, '').split('\n') : []))
    }
  }
  return { text: QUIET_CRAFT_OVERRIDE + lines.join('\n'), missed }
}
