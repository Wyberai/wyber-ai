# Section patterns: what real sites compose that our kit lacked (25 Nov 2026)

Sources: `docs/design-reference/corpus-knowledge.md` and the corpus report (landing-page section names across 3,903 repos: hero 596, features 404, stats 392, gallery 377, testimonials 350, timeline/process 345, products grid 319, pricing 291, blog 261, team 254, about 244, cta 241, contact 240, faq 197, logo cloud 143, booking 142, bento 63; hero variants image/video 49 of 66, split 3, centered 4, with product mockup 5), and the principles list in `docs/design-reference/jiro-sections-used.md` (`jiro-study.md` is not in the repo on any branch, so only that ledger was available). Nothing here copies any Jiro or third-party markup, copy or layout: only patterns and principles (a pattern is a way of arranging things, for example "pin the heading while a list scrolls", which no one owns).

## Patterns the old kit lacked, and what was done

| Pattern real sites use | Built as | Notes |
|---|---|---|
| Sticky-scroll storytelling / stacking cards | `FeaturesStack`, sticky heading in `FeaturesLedger`, `StepsPath` spine that fills on scroll | Plain `position: sticky`; the spine fill uses `animation-timeline: view()` and is a full line where unsupported |
| Horizontal scroll gallery | `FeaturesScroller` | Native scroll-snap container, keyboard focusable, no script |
| Marquee proof band | `RibbonBand` (names on the page), existing `FactTicker` (owner facts) | CSS keyframes; reduced motion stops it and wraps it as text; fewer than three items renders nothing |
| Split-screen hero with a tabbed product | `HeroTabbed` (tabs are the first list's own items), `HeroSplitScreen` (solid half + photo half) | real `tablist`/`tab`/`tabpanel`, arrow keys, Home/End |
| Large numbered index list | `HeroIndex`, `FeaturesZigzag`, `AboutNotes`, `HeaderDetails` index overlay | |
| Timeline rails | `StepsRail` (horizontal), `StepsPath` (central spine), existing `StepsTimeline` | |
| Accordion-driven feature explorer | `FeaturesTabs`, `StepsAccordion`, `FaqDetails` | `StepsAccordion` and `FaqDetails` are native `<details name>` exclusive groups; height animation via `::details-content` + `interpolate-size` where supported |
| Price list / menu with leaders | `FeaturesLedger`, `HeroLedger` | dotted leader between name and the owner's own detail line |
| Pricing ladder | not new: SaaS already ships `cards`/`table` plans from `src/plans.ts` | plans stay data-driven |
| Map and hours panel for local businesses | `VisitCards`, `VisitStatement` | facts are the owner's; the maps link stays a link (no third-party embed, no key) |
| Floating / two-tier / utility navigation | `HeaderIsland`, `HeaderStack`, `HeaderUtility` (owner facts strip) | `HeaderDetails` is a native disclosure |
| Mosaic / asymmetric tile grids | `FeaturesMosaic` | tile spans per count always close whole rows |
| Overlapping photo + text card, triptych, sheet | `HeroOverlap`, `AboutOverlap`, `HeroTriptych` (one photo, three crops), `HeroSheet` | |
| Inverted contact panel, stacked contact, solid/centred footers, centred / strip CTAs | `ContactInverted`, `ContactStacked`, `FooterColumns`, `FooterCentered`, `CtaCentered`, `CtaStrip` | |

## Deliberately NOT built (and why)

- **Before/after slider**: needs two real photographs of the same subject; we have one generated hero scene. Gate it on provided assets when the build can accept uploads.
- **Testimonials, logo clouds, stat counters, team grids**: all need facts the owner has not given. Inventing them breaks the honesty contract.
- **Comparison table**: items carry title, text and an optional detail line, not comparable columns. Plans already render as a table for SaaS.
- **Live map embed**: third-party iframe, tracking, key and preview-sandbox problems. A link opens the map.

## Contract every new section keeps

Content only from props (owner facts, the copy slots); even grids (`fitSpans`, `MOSAIC` spans always close rows, odd FAQ last item spans both columns); tokens only, no palette classes or hex; reduced-motion safe (CSS animations are inside `prefers-reduced-motion: no-preference`; framer-motion fades check `useReducedMotion`); complete without scroll-driven CSS, View Transitions or `interpolate-size`; no `backdrop-blur`, no `radial-gradient`, no `transition-all`, no hover scale; `src/lib/unslop.ts` untouched and `scanSlopSource` clean on the whole file and on generated pages (tests: `wyber-sections.test.ts`, `wyber-sections-render.test.ts`, `website-spec/variety.test.ts`, `saas-spec/saas-variety.test.ts`). The preview engine only guarantees react, framer-motion and clsx: the new code imports only `react` (`useId` is React 18), `react-dom` (already used), `framer-motion` and `lucide-react` icons already in the old sections.

## Plan changes

`SectionStyles` (`src/lib/website-spec/types.ts`) grew: header 3 to 7, hero 5 to 12, features 4 to 10, steps 2 to 5, about 2 to 5, FAQ 2 to 4, CTA 2 to 4, contact 2 to 4, footer 2 to 4, plus new `visit` (3), `strip` (3) and `lead` (list or about first). Component names live in one place, `src/lib/website-spec/composition.ts`, used by both renderers and by the variety tests. Gates: photograph-led directions only draw heroes that show the photograph in the first screen; type-led ones never draw a hero that needs a photograph; the ledger hero and utility header need owner facts; the about photograph is only generated when the chosen about section shows it; a tabbed hero never meets a tabs feature list.
