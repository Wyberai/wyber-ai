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
- **Languages:** English only by decision (2026-11-08). `I18N_ENABLED` in `src/lib/i18n/locales.ts` is now `false`, which hides the language switch on the homepage, pricing and settings and ignores any stored non-English choice. The translations and the `/hi`, `/kn`, `/te`, `/ta` URL routes still exist and can be reached directly; flip the flag back to `true` to restore the switch.
- **The simulated "first build" screen from the prototype was not ported.** The real dashboard performs the build. The credit-wall behaviour is the dashboard's existing logic.

## Checked

- `tsc --noEmit` clean, `vitest run src/lib` 1250 passed, `next build` succeeds.
- Production build, phone width (375px): no horizontal overflow on `/`, `/solve`; describe flow gives sketch plus 3 questions; "Build this" stores the prompt, type and label and lands on `/signup` showing the reminder card.
- Dev server (Turbopack) in the preview pane did not hydrate the new pages; the production build does. Not investigated further.

## Needs your eyes

1. The tagline is still "Describe it. Watch it. Own it." (your call).
2. `/solve` and `/create` sketches are generated from keyword rules in `src/lib/signal/guide.ts`, not by a model. They say "a sketch from your words".
3. The agency door now plays a 10-second 720p clip (Seedance 2.0, text to video; the first attempt from the still was rejected by the provider with ip_detected and cost nothing). The other three clips are 15 seconds, so it is shorter than its siblings. Higgsfield has about 8.8 credits left; a 15-second 720p clip costs 67.5.
4. Pricing, free credits and model policy were not touched.
5. Not tested: real sign-in (needs a real code), `/onboarding` and `/mfa` in a browser (auth-gated); both type-check and build.

## Editor chat panel pass

Files: `ChatPanel.tsx`, `VoiceButton.tsx`, `MobileLayout.tsx`, `agent-team/*`, `editor.css`.

- **Accessibility:** the conversation is a labelled `role="log"` with `aria-busy` while a build runs, so a screen reader hears the finished answer rather than every streamed fragment (not tested with a real screen reader). Every icon button has a name; the composer has a label.
- **Scroll:** follows new content only while you are at the bottom; scrolled up, it stays put and shows a "Latest" button. No more smooth-scroll on every token.
- **Touch and phones:** 44px targets and a 16px input on touch or narrow screens (stops the iOS zoom on focus); `100dvh` and safe-area padding on the mobile editor.
- **Readability:** secondary text raised from about 3:1 to about 5.9:1 contrast (overridden in `editor.css`; frozen `brand.css` untouched); nothing in the chat or agent-team cards under 12px.
- **Signal palette** applied to the editor tokens (`.ide-root`), the same values as the site.
- **New:** thumbs up/down on finished responses (tracked as `chat_feedback`), and next-step chips under the latest finished build (tracked as `chat_next_step_picked`). The chips only fill the input box; they never send or spend credits, and are the same for every project of a given type.
- **Already existed, left alone:** the agent feed, turn receipt, checkpoints and restore, retry, edit, queue, plan mode, `@file`, voice.
- **Review harness:** `/dev/chat` renders the real panel with fake data (`?state=generating|nocredits|empty`, `?w=full`). It only exists when `NEXT_PUBLIC_DEV_SANDBOX=1` is set; in a normal build it redirects to login. Run it with `NEXT_PUBLIC_DEV_SANDBOX=1 npx next dev -p 3100`.
- **Not done:** per-turn undo (the header's checkpoint control already covers restore), a "fix it" cost label on Retry (the real cost depends on build size, so I did not state one), and the rest of the editor screens (preview, file tree, settings panels), which were not reviewed.

## Editor shell pass (beyond the chat panel)

Reviewed with the `/dev/editor` harness (fake project; `?m=1` for the phone layout). Same flag as `/dev/chat`.

- **Before:** no landmarks, no headings, no `aria-*` anywhere in the shell; the 18-icon right rail did not say which panel was open; the panel divider worked with a mouse only; 10 to 11px text in the top bar, preview, tabs, publish and history; the phone top bar wrapped "Invoice tracker", "Export code" and "100 credits" onto two lines each.
- **Now:** banner, main (preview), complementary (assistant and tools), navigation (panel rail, `aria-current` on the open one) and a region plus an `h2` per panel. The divider is a keyboard-resizable separator (arrow keys, Shift for bigger steps) with a wider hit area. Chrome text is at least 12px (11px for the small uppercase labels). The phone top bar is one line: the project name truncates, export is icon-only, the MOBILE badge is hidden, and credits read "100 cr" at readable contrast. On touch screens, editor buttons are at least 40px.
- **Not done:** the panels inside the rail (security, payments, connectors, SEO, analytics and so on) were not reviewed one by one; the file tree and code editor were not exercised with real files in the harness; no screen-reader test.

## Right-rail panels pass

All 17 panels were swept in the `/dev/editor` harness (open each, count unnamed controls, unlabelled inputs, targets under 24px and text under 12px).

| | Before | After |
|---|---|---|
| Controls with no accessible name | 9 | 0 |
| Inputs with no label | 11 | 0 |
| Targets under 24px | about 30 | 6 |
| Text under 12px | over 200 (Connectors alone 109, SEO 22) | 25 (mostly the 11px uppercase micro-labels) |

- **Real bug fixed:** the WyberCloud (Database) panel was built with Tailwind spacing classes, which the site's global reset switches off, so its tabs and banners rendered with no padding. It now opts in with the site's existing `.wy-journey` escape hatch. Its emoji tab icons were removed, the double `h1` became `h2`/`h3`, and the tabs report their pressed state.
- **Shared fixes:** 128 font sizes raised to 12px and 22 inputs given an accessible name (from their placeholder) across the panel files; the Feedback on/off control is now a labelled switch.
- **Not done:** emoji inside some panel copy (for example the Security panel's headings) are left as they were; the remaining small targets are in the Agent, Figma, Database, Feedback, GitHub and Supabase panels; panels were seen only in their empty or error state, since the harness has no real project data or login; no screen-reader test.

## Motion pass

- **New:** `src/styles/motion.css` (imported in `layout.tsx`) and `components/shared/WyberLoader.tsx`.
- **Animated logo:** the mark's two chevrons draw in one after the other on a 2.4s loop while the tile breathes (`AnimatedMark`, states `loading`, `idle`, `still`). Used by the route loading screen (`src/app/loading.tsx`), the preview's empty state (idle, a slow glow) and the preview's "building" overlay, which replaces the amber spinner with the sky-blue mark and lifts its grey text from about 2.4:1.
- **Reduced motion:** for people who ask their device for less motion, loops stop and transitions are instant across the whole site, and the logo shows fully drawn and still. Spinners and the loader bar keep moving, since they are the only sign that work is happening. Before, only 8 places respected this setting.
- **Checked:** keyframe values at 0, 300, 720, 1200, 1872, 2200 and 2400ms; the reduced-motion rule's effect on the logo, the loader bar and an inline spinner.
- **Not done:** the 31 copy-pasted `@keyframes spin` definitions were left alone (they all behave the same, and removing them is churn with no visible gain); the dashboard still uses its skeleton shimmer; no page transitions or scroll animations were added on purpose.
- **Caveat:** the review browser did not advance its animation clock, so I verified the animation by seeking it to specific times rather than watching it play. Please watch it once in a normal browser.
- **Review page:** `/dev/loader` (same `NEXT_PUBLIC_DEV_SANDBOX=1` flag).

## Logged-in screens pass

Reviewed with `/dev/screens` (fake data, same `NEXT_PUBLIC_DEV_SANDBOX=1` flag): `?s=dashboard`, `dashboard-empty`, `clients`, `clients-empty`, `onboarding`. These had never been rendered before.

- **Dashboard:** it already had landmarks and a heading. Fixed: the prompt box and the send button had no names; the send arrow was white on sky blue (about 2.8:1) and is now dark; Delete and Duplicate on project cards were 24px and are now 32px, named per project; 17 text items under 12px are now 12px or more; on phones the type pills (Web app, Mobile, Website, SaaS) wrap instead of scrolling sideways, and buttons are at least 40px.
- **`/clients`:** it had no main landmark; three labels in the client form were not tied to their inputs (Status, Brand colour, Intro text); the colour picker, headline field and project select had no names; Delete and Remove were 18px text links; text was 10 to 11px. All fixed, and the empty state now explains what the page is for.
- **Onboarding:** worked through all three steps with no problems found (targets all 40px or more, labels fine).
- **Not covered:** the 2FA screen still cannot be rendered without a real signed-in session with a second factor; real project thumbnails and real security badges on the dashboard; the Delete-project dialog and Import modal were not opened.
- **Known dev-only warning:** React logs "script tag while rendering" for the theme script inside the shared Signal frame on client-rendered pages. The script is in the server HTML, so users are not affected; I left it.

## Whole-site pass (every other page)

There are 196 routes. The Signal pages, the editor and the dashboard were done earlier. The remaining ~110 public pages (marketing, blog, docs, vs, use-cases, legal, marketplace, tools and so on), plus the admin and internal screens, share the old inline styles and design variables, so they were moved onto the same palette in one systematic pass instead of by hand:

- **Shared variables:** `src/styles/tokens.css` (loaded after `globals.css` and `brand.css`, which are untouched) aligns the dark-theme variables with Signal: the page background, surfaces, borders and text. Secondary text (`--text3`) was `#3D4468`, about 2:1 on the page background, and is now `#8797ab` (about 5.9:1); `--brand-text-faint` was about 3:1 and is raised the same way.
- **Hard-coded colours (codemods, about 1,500 edits in about 130 files):** neutral dark greys and surfaces (`#09090b`, `#111113`, `#1a1a22`, `#52525b`, `#3f3f46`, `#71717a`, `#a1a1aa` and similar) mapped to their Signal equivalents; text colours chosen for light backgrounds (`#059669`, `#7c3aed`, `#a855f7` and similar) mapped to lighter tones of the same hue; white text on bright brand fills (sky, green, orange, amber) flipped to dark text, only where white failed 4.5:1 and dark does better, and the buttons whose fill comes from data now use the existing `readableOn()` helper. Files with light surfaces were skipped, as were the OG image routes.
- **Tiny text:** 9 to 10.5px literals in page files raised to 11px.
- **Landmarks:** `MainLandmark` in the root layout marks the page's root container as the main region on any page that has no `<main>`, so keyboard and screen-reader users can jump to the content.
- **Verified in a browser:** 53 pages at desktop width and 24 at 375px width, measuring sideways overflow, text contrast (computed from the rendered colours) and landmarks. Overflow: none found. Contrast failures on the sampled pages went from dozens per page (`/changelog` 58, `/gujaratexpo` 21, `/marketplace` 35, `/community-programs` 10) to zero on nearly all; see "not done" for the remainder.
- **Not done:** I did not open every one of the ~196 routes; I sampled every distinct template (each blog, docs, vs and inventory page shares one) rather than all 14 blog posts and 24 docs pages. The admin, GTM and AI-employee screens got the colour passes but were not opened (they need a login). The shared top bar of older pages still differs from the Signal bar. A few items still fail contrast on `/marketplace` (data-coloured badges, now neutral text; not re-measured), the `/complexity-guide` violet tier and the decorative `|` separator on `/agents`. About 20 to 80 small-text items per page remain (11px labels), by design.
