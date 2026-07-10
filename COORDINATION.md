# July 2026 Overhaul — Session Coordination

Three parallel sessions ship the July-2026 overhaul. Release branch =
`feat/better-lovable-design-trust-images` (prod tracks it — no direct
commits). Merge order: **B → C → A**.

| Session | Scope | Branch |
| --- | --- | --- |
| A | Marketing site + space-journey | (A's branch) |
| B | Generated-app design pipeline | `session-b/design-pipeline` (PR #21) |
| C | Editor/IDE + Themes, Visual Edits, Images, Plan directions | `session-c/editor-features` |

## File ownership (hard rules)

| Files | Owner | Notes |
| --- | --- | --- |
| `src/app/globals.css` | **A** | C never touches; editor chrome goes in `src/styles/editor.css` or inline styles |
| `src/app/HomeClient.tsx`, marketing routes, `src/app/space-journey/**`, `public/space/**` | **A** | |
| `src/app/api/generate/route.ts`, `src/lib/design-system.ts`, `src/lib/design-palettes.ts`, `src/lib/wyber-ui-kit.ts`, `src/lib/sanitize-files.ts` | **B** | Merged via PR #21; C consumes only |
| `src/components/editor/**`, `src/components/themes/**` | **C** | |
| `src/lib/wyber-preview/engine.ts`, `src/lib/generate-image-persist.ts`, `src/lib/image-directives.ts` | **C** | |
| `src/lib/app-theme.ts`, `src/lib/visual-edit-apply.ts`, `src/app/api/images/**` (new) | **C** | |
| `api/plan`, `api/projects` | **C** | |
| `src/styles/editor.css` | **C** | |
| `src/styles/brand.css`, `src/lib/brand-tokens.ts` | **C created — FROZEN** | A and C both consume; no value edits without cross-session signoff |

## Frozen brand tokens

`src/styles/brand.css` (CSS vars, imported from `layout.tsx`) and
`src/lib/brand-tokens.ts` (JS mirror) carry the space-journey visual
language: `--brand-bg:#05060A`, `--brand-accent:#0EA5E9`,
`--brand-glow:rgba(14,165,233,.35)`, hairline border colors, JetBrains Mono
stack, motion durations/easings, and a film-grain noise data-URI. They are
frozen after the Phase-0 commit.

## Session B interfaces (consume, don't rebuild)

From `src/lib/design-palettes.ts` (PR #21):

- `PALETTES` — 30 palettes. Each `Palette = { id, label, vibe, mode:
  'light'|'dark', fontSans, fontDisplay, radius, tokens:
  Record<string,string> (shadcn token name → HSL channels like
  "199 89% 48%"), gradientHero, domains }`.
- `getPaletteById(id): Palette | undefined`
- `pickPaletteOptions(prompt, n = 3, rnd = Math.random): Palette[]` — n
  distinct palettes, strong-domain matches first, mode/family-diverse.
  Use for Plan-Mode direction cards.
- `renderDesignBrief(pal): string` — the design-brief text block.
- `POST /api/generate` accepts optional `paletteId` in the JSON body;
  unknown/absent ids fall back to the prompt-matched pick.

Wyber UI Kit adds 8 components (MonoLabel, SectionNumber, EditorialHeadline,
HairlineFrame, MediaFrame, PinnedStory, DataRow, CursorGlow);
`GOOGLE_FONTS_LINKS` now loads Instrument Serif + Fraunces.

## Ground rules

- Never use bare `git stash` (shared stash stack across sessions).
- New editor widgets must be wrapped in
  `src/components/shared/ErrorBoundary.tsx`; the preview build/heal loop is
  logic-frozen (memory: a widget crash once took the preview down for days).
- Verify before push: E2E in the real editor; untested items get a
  risk-ordered manual checklist in the PR.
