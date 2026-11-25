# Jiro sections: ledger

Date: 2026-11-19.

**No Jiro section, source, copy or layout is used in WyberAi's generated sites.** Jiro's Terms & Conditions (jiro.build/terms-conditions) limit the founder's lifetime plan to building sites for themselves or clients (§6.2, non-transferable, no sublicensing), and §4 forbids redistributing Content as a template pack, component library or competing resource, using it for a competing product, using it to train or test AI models, and bulk extraction. Shipping Jiro-derived source inside the kit that every generated site receives would break those terms, so the sections in `src/lib/wyber-sections.ts` are original compositions.

Nothing was fetched through the Jiro MCP for this work (`get_component` was never called, no code payload was read). The only Jiro-derived input is the principles in `docs/design-reference/jiro-study.md` (proportion, type scale, rhythm, restraint, imagery), which record measurements and general practice, not a section's arrangement or source.

## What each section is inspired by (principle only)

| Component (`src/lib/wyber-sections.ts`) | Category | Inspired by (principle) |
|---|---|---|
| HeaderBar | header | One quiet row, hairline appears on scroll |
| HeaderCentered | header | Brand centred, links split either side |
| HeaderIndex | header | Numbered mono links, monogram square |
| HeroSplitPhoto | hero | Large display type against one framed photo; facts on a hairline |
| HeroEditorial | hero | Display type used as the image (up to 10.5rem, tight tracking); wide photo underneath |
| HeroCentered | hero | Centred statement, arched photo below |
| HeroFullBleed | hero | One full-bleed photo, text low and left, black scrim only (solid-stop dark scrim) |
| HeroMinimal | hero | Type alone: huge headline, vertical hairline, no image needed |
| FeaturesIndex | features | Numbered rows between hairlines, title large, text small |
| FeaturesCards | features | Photo-less cards with large numerals; counts of 3 to 6 never leave an orphan row |
| FeaturesBento | features | One dark lead card and three plain cards in an asymmetric 3x3 grid |
| FeaturesGrid | features | Sticky heading beside a two-by-two grid divided by hairlines |
| StepsColumns | steps | Large numerals over hairline columns |
| StepsTimeline | steps | Sticky heading beside a vertical rule with numbered markers |
| AboutSplit | about | Tall framed photo beside a lead paragraph set in display type |
| AboutBand | about | Display headline, lead and body in two columns, wide photo band |
| FaqSplit | FAQ | Sticky heading, large questions between hairlines |
| FaqBoxed | FAQ | Centred title, each question a bordered card |
| CtaBand | closing CTA | Full-width inverted band, oversized headline |
| CtaSplit | closing CTA | One bordered panel, headline left, action right |
| ContactSplit | contact | Heading and contact facts beside a form panel |
| ContactCentered | contact | Centred heading, narrow form panel, facts below |
| FooterGiant | footer | Brand name as oversized graphic, link columns above |
| FooterSlim | footer | One row: brand, links, note |

Not built: gallery/image strip. The website plan only has a hero slot and an about slot, so a strip would need extra generated images (credits) or invented content.

## Anti-slop scanner

`src/lib/unslop.ts` (`scanSlopSource`) skips only paths matching `wyber-ui` or `wyber-grow`, so `src/wyber-sections.tsx` IS scanned like generated source. The sections are written to pass it with no exemption (checked by `src/lib/wyber-sections.test.ts`). Nothing in the scanner was changed.

## 25 Nov 2026 addition: 11 headers/heroes and 23 sections

All new components in `wyber-sections-heroes.ts` and `wyber-sections-blocks.ts` are original. Nothing was fetched through the Jiro MCP (no `get_component`, no `search_components`), and no Jiro markup, copy or layout was read or reproduced. Inspiration is by general pattern only (sticky pinning, snap scrolling, native disclosures, ledgers with dotted leaders, rails, mosaics); see `docs/design-reference/section-patterns-nov25.md` for the full pattern table and the list of patterns deliberately not built.
