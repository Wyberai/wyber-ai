# Corpus knowledge base: what feeds the generators, and what does not

Source: GitHub design corpus (3,903 public open-licensed repos; collector on branch `research/github-design-corpus`, commit d7c1404).
Rebuild: `git show research/github-design-corpus:docs/github-design-corpus/corpus.jsonl > corpus.jsonl && node scripts/build-design-knowledge.mjs corpus.jsonl`
Output: `src/lib/design-knowledge.ts` (generated, aggregate counts only; every entry is `{ key, repos }` with denominators and a `limits` list).
Logic: `src/lib/design-variety.ts`. Tests: `src/lib/design-variety.test.ts`.

## Used in the generators
| Evidence | Used for |
|---|---|
| Primary colour families: neutral 109 + blue 88 of 299 repos (66%) | direction pick weight: directions whose primary is neutral or blue are picked a little less often (weight 1 - 0.7 x corpus share) |
| Mono faces: JetBrains Mono 183, Geist Mono 140, Source Code Pro 86, IBM Plex Mono 40 vs DM Mono 4 of 3,903 | `fonts.mono` per direction: 12 of 31 moved off DM Mono (tool, tech, dark: JetBrains Mono; professional and spec: IBM Plex Mono); warm, human, photo-led directions keep DM Mono |
| Hero variants: image/video 49 of 66, gradient/aurora/mesh 8 | gradient-field heroes weighted 0.8 (weak evidence, mild nudge) |
| Default theme: light 172, dark 19 of 191 | no change needed (library is already 76% light); dark fillers are no longer dealt to briefs they do not fit |

## Decisions that are NOT from the corpus
- The cream cap (cream grounds weighted 0.55, cream fillers a further 0.5) answers the founder's complaint; the corpus records only light/dark, not paper tint.
- More fillers: `hs-expedition` became a generalist (photo-led, names no trade) so fillers are not only the same four.

## What the data cannot support (do not claim)
- Palette by industry for local trades: healthcare has 7 readable primaries, restaurants 4, legal 1. Only saas (73), ai (31), agency (26), fintech (23), portfolio (23), blog (22) have 20+, and even there blue + neutral lead.
- Section ORDER by site type: the collector recorded which section names exist, not their sequence.
- Motion techniques: only motion-library presence (framer-motion 591, three 127, reanimated 123), not what animates.
- Spacing scales: 65 repos override Tailwind spacing. Radius tiers are the only scale recorded (standard 339, sharp 161, soft 121 of 621).
- The sample is design-forward developer-facing repos, not small-business sites.

## Not done (needs design review, not data)
Palette variants within a direction (a cool-paper twin of each cream direction). The directions' composition text names the ground ("warm paper"), so swapping tokens alone would make the brief contradict the palette.
Jiro: no Jiro code or payload is used; see `jiro-study.md`.
