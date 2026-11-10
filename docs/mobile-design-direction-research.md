# Mobile design directions (10 Nov 2026)

## Why
The mobile prompt picked a random "design seed" from 8 one-line vibes and a random layout seed. Nothing matched the app being built, and the seed gave no exact values, so two builds could share a vibe yet still look the same, and a wellness app could draw "Luxury dark". Web already deals a researched direction by fit (`design-directions.ts`); mobile now does too (`mobile-directions.ts`), behind the same flag (`NEXT_PUBLIC_DESIGN_DIRECTIONS`, default off).

## Evidence, and its limits
- Apple Design Awards 2026 (announced 2 Jun 2026), iPhone winners: Tide Guide (Visuals and Graphics: full-screen animated charts, sky-matching palette, Liquid Glass), Moonlitt (Interaction: easy onboarding, Liquid Glass), grug (Delight and Fun: playful daily prompts), Guitar Wiz (Inclusivity: Dynamic Type, Increased Contrast, Differentiate Without Color).
- Google Play Best of 2025: Focus Friend (Best App), Edits (Best for Fun), Goodnotes (Large Screens), Calm (XR), Wiser (Everyday Essential).
- Platform direction: Liquid Glass on iOS 26, Material 3 Expressive on Android (physics-based motion, more personality).
- **Limit:** unlike the web library, these anchors are named references, not measured values. Native apps expose no DOM or computed styles, so palettes, radii and type scales are our own design decisions informed by those apps, not copies. Colour values were checked for WCAG contrast in `mobile-directions.test.ts`.

## The 12 directions
| id | mode | for |
|---|---|---|
| m-paper-notes (generalist) | light | notes, to-do, habits, planners |
| m-calm-sage | light | meditation, sleep, wellness |
| m-cash-bold | dark | wallets, payments, trading |
| m-ledger-calm | light | expenses, budgets, billing, inventory |
| m-sport-energy | dark | fitness, running, coaching |
| m-play-bright | light | learning, kids, quizzes, games |
| m-market-warm | light | marketplace, food, travel, bookings |
| m-field-tool | light | drivers, riders, staff, attendance |
| m-sky-data | dark | weather, tides, sensors, monitoring |
| m-luxe-dark | dark | luxury, fashion, membership |
| m-social-feed | light | social, community, chat |
| m-reader-editorial | light | news, books, podcasts, recipes |

## Design constraints specific to mobile
- Previews run in Expo Snack (RN-web) with `expo-font` only, so directions use the system font with deliberate weight, size and tracking, plus platform serif (Georgia / serif) for two directions. Custom Google fonts would need `@expo-google-fonts` packages added to the Snack dependency list first.
- Tap targets at least 44px, primary action in the lower half, status never by colour alone, one icon family. These are in the brief as hard rules.
- Dark directions use tinted near-black, never `#000`, and the pure-purple accent is blocked by a test.

## Not yet done
- Real mobile builds through `/api/generate` (needs an RN-web render harness; the web harness does not render React Native).
- A mobile lint (hex inside StyleSheets, emoji icons, tap targets).
- Plan Mode cards for mobile.
