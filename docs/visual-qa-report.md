# Visual QA gate: report (27 Nov 2026)

On 25 Nov the founder found by eye that step badges covered heading letters on a live law-firm site. Our tests read source text, not rendered pages. This gate renders real generated sites in the installed Chrome and measures them.

## How to run it

- Fast subset: part of the normal test run (`src/lib/visual-qa/visual-layout.test.ts`), so the pre-push hook runs it.
- Full matrix: `npm run qa:visual` (`--only <id>`, `--widths 390,1440`, `--html <dir>`). Findings go to `verify-out-visual/`; the exit code is 1 when there are any.
- It needs Chrome (or Edge); set `CHROME_PATH` if it is somewhere unusual. Without Chrome the browser tests are skipped locally and fail in CI. `SKIP_VISUAL_QA=1` skips them on purpose.

## What is covered

Business briefs at three copy lengths (each copy set passes the production copy validator), the three demo sites (including the Hindi toggle), SaaS products with their app and terms screens, a Replace-your-SaaS tool and web apps. Every direction, every composition in `wyber-sections.ts`, every font pairing and colour family appears at least once (a test checks this). Widths 390, 768 and 1440. Each page is measured at every step of a full scroll, so reveals are checked half-way and finished, and again with the mobile menu, app dialogs and forms open. Some websites also run without scroll-driven animation (the Safari/Firefox path).

Checks: covered text, text over text, sideways scroll, elements wider than the screen, clipped or truncated text, text spilling out of its box, words split across lines, crowded headers, text under 12px, orphan grid rows, images with no reserved size, low contrast (`color-contrast.ts`), tap targets under 40px on phones, absolute or sticky elements inside animated wrappers, and reveals that never finish. One test plants each kind of fault and requires it to be caught; another puts the 25 Nov badge bug back and requires it to be caught.

## Results

| Run | Pages | Findings |
|---|---|---|
| First full run | all cases | 3,934 |
| After the main fixes | 327 | 49 in 3 groups |
| Final full run | FINAL_PAGES | FINAL_FINDINGS |

## Defects found and fixed

| # | Defect | Fix |
|---|---|---|
| 1 | Fact row left one item alone on a second row (2+1) | Wrapping row; the last item fills it |
| 2 | A long email or address made the whole page scroll sideways | Facts and visit details may break |
| 3 | Full-screen hero without a photo had invisible facts, phone and accent words (the planner normally gives it a photo) | Colours invert on the dark ground |
| 4 | Brand-colour accent word hard to see on dark heroes | Keeps the text colour, with a brand-colour underline |
| 5 | Long button labels ran out of fixed-height buttons | Buttons grow; kit buttons are 40px on phones |
| 6 | Tap targets under 40px: footer, phone, email, map, brand and hero links, language toggle, tabs, close buttons, sign-in and legal links, app row titles, Remind | Taller on phones; desktop spacing mostly unchanged |
| 7 | Feature cards ran into each other at 768px | Less padding and smaller titles below laptop width |
| 8 | Four step columns overlapped at 768px | Two by two below laptop width |
| 9 | Sticky contact bar hid the last lines (Terms) | The page ends later while the bar shows |
| 10 | Text under 12px: kit labels, browser-frame address, product preview numbers, app tab bar | 12px minimum |
| 11 | Preview address truncated on phones | More room; it may wrap |
| 12 | A wide display font with a long word pushed the hero off a phone | A heading steps down only when a word does not fit; words are never split; `h1`/`h2` tags unchanged |
| 13 | Giant footer wordmark split a name mid-word | Same fitting rule |
| 14 | Pale brand colours used as text (acid mono 1.08:1, donate yellow 1.5:1, others) | A darker or lighter shade of the same hue for text only (`textSafe`); fills unchanged |
| 15 | Faded text on inverted blocks below 4.5:1 | Raised to 90-95% |
| 16 | Header crushed at 768px: links three lines high, button four (found by eye; a "crowded header" check was added) | Full link row from laptop width; tablets get the menu button |
| 17 | A long business name wrapped to four lines in the header | Full width beside the menu button and a size step down |
| 18 | Two hero actions drifted far apart beside a tall paragraph | Kept together |
| 19 | Minimal hero's side label stacked to seven lines on tablets | Moved above the headline below laptop width |
| 20 | Web-app card details left one field alone on a row | Last odd field spans the row |
| 21 | Hindi in the language toggle was cut off | The toggle no longer shrinks |
| 22 | "Overdue" badge 4.27:1 on a dark palette | The readable shade also allows for the badge's own tint |
| 23 | Money figure spilled out of its preview box at 768px | Smaller below laptop width |

**One design change to look at:** on pale-brand palettes, large numbers and labels that were pale yellow are now a dark olive-brown. Buttons and fills keep the original colour.

## Not fixed, and what the gate does not cover

- Other UI-kit components that the spec pipelines never use still have 10-11px text (about 20 places). Only free-form builds can reach them.
- Free-form builds and the older website path (specs without section styles) are not rendered.
- Text over photographs is not contrast-checked: the harness uses flat placeholder pictures.
- It renders with this repo's React 19 and lucide 1.x, not the React 18 and lucide 0.383 that generated sites install. Tailwind is the matching v3.
- Copy is stand-in text, not model output. Fonts are fetched from the network, so a run without it measures fallback fonts.
- The 34 new sections on `claude/cool-bardeen-431d38` (not merged) are not in this matrix. SECTION_TRIAL
- The GitHub test workflow runs only on `main`, `builder/**` and pull requests.
- The `tailwind.config.js` in the render comes from the project itself; the one new dependency is `tailwindcss-v3` (dev only).
