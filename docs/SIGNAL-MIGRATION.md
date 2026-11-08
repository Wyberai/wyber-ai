# Signal design migration: review notes

Branch: `design/signal-migration` (local commits only, nothing pushed, nothing deployed).
Kill switch: set `NEXT_PUBLIC_SIGNAL_DESIGN=0` and the homepage returns to the previous design.

## What is migrated

| Surface | State |
|---|---|
| Design layer | `src/styles/signal.css`, scoped under `.sg` (dark default, light via the nav switch, own storage key `wyber-sg-theme`). The frozen `brand.css` and the global theme are untouched. |
| Shell | `SignalNav`, `SignalFooter`, `SignalFrame` (skip link, landmarks). `bare` mode for sign-up and onboarding. |
| Homepage `/` | The question and four doors, theatre, tour, facts, pricing band, FAQ. English only: other languages still get the previous homepage. |
| `/solve`, `/create` | New. Describe the problem or idea, get a sketch and three tap questions, then "Build this" carries it through sign-up into the first build (the dashboard's existing `wyber-pending-*` hand-off). |
| `/agencies` | New. A working client-page demo that follows the real rules: dark client page, client colour on buttons with readable text, 404 unless the client is active. |
| `/signup`, `/login` | Rewritten UI, same Supabase logic (OAuth, email code, `next`, `ref`, `error=auth`). Six code boxes with paste and auto-verify. A reminder card of what the visitor was about to build. The unbacked "2,400+ apps / 4.9" block is gone. |
| `/onboarding` | Name, optional role, and the product question only when no brief exists. With a brief it goes to `/dashboard`, where the saved prompt starts the build. "AI employees / GTM" wording removed. |
| `/mfa` | Restyled, same logic. |
| Dashboard | Signal palette applied through a scoped `.sg-dash` root that re-points the editor variables (logic untouched). Muted text raised to Signal ink-3, white-on-blue buttons now dark text, violet gradients replaced by the single accent. Layout is unchanged; the Clients, Usage and Settings entries from the prototype were not added. **Not viewed in a browser (login required).** |
| `/pricing`, `/byos` | Moved into the Signal shell (shared nav and footer). Plans, prices, credit rows, checkout and the byos flow are unchanged; byos colours and button text follow Signal. The India language switch moved from the old nav to a row above the hero. The purple Premier League nav link was dropped with the old nav. Plan colours are still multi-hue (they identify plans). |
| Shared footer | `Footer.tsx` now renders the Signal footer (locale-aware links) on every page that used it: template, blog, legal, docs and locale pages. Added The Journey link and social links; the Turbo0 listing badge was dropped. |
| Shared top bar | `Navbar.tsx` (about 24 template, blog, legal, docs and locale pages) takes the Signal palette through a scoped `.sgx` class on the bar and its mobile drawer; the Resources mega-menu, keyboard handling, locale links and sign-in state are untouched. White-on-blue buttons now use dark text. The "Win $1,000" Premier League link is kept, per the earlier decision to leave the contest as it is. |
| `/clients` | Colours mapped to the Signal palette; very faint grey text (about 2:1) raised to readable greys; white-on-blue buttons now dark text; emoji removed from the empty state. Layout and logic unchanged. Not viewed in a browser (login required). |
| Copy and emails | Earlier commit `852708d`: unbacked claims removed, readable text on client colours and email buttons, shorter first-week emails. |

## Not migrated (on purpose)

- **`/client/[slug]`**: unchanged on purpose; it shows the client's own brand colour, not Signal.
- **Non-English homepage**: still the previous design.
- **The simulated "first build" screen from the prototype was not ported.** The real dashboard performs the build. The credit-wall behaviour is the dashboard's existing logic.

## Checked

- `tsc --noEmit` clean, `vitest run src/lib` 1250 passed, `next build` succeeds.
- Production build, phone width (375px): no horizontal overflow on `/`, `/solve`; describe flow gives sketch plus 3 questions; "Build this" stores the prompt, type and label and lands on `/signup` showing the reminder card.
- Dev server (Turbopack) in the preview pane did not hydrate the new pages; the production build does. Not investigated further.

## Needs your eyes

1. The tagline is still "Describe it. Watch it. Own it." (your call).
2. `/solve` and `/create` sketches are generated from keyword rules in `src/lib/signal/guide.ts`, not by a model. They say "a sketch from your words".
3. Higgsfield was out of credits: no agency video, the `/agencies` door uses a still.
4. Pricing, free credits and model policy were not touched.
5. Not tested: real sign-in (needs a real code), `/onboarding` and `/mfa` in a browser (auth-gated); both type-check and build.
