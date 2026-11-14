# Mobile spike, 14 Nov 2026

Question: can generated mobile apps and their Snack preview move from our SDK 54 pins to Expo SDK 58, and what is true today?

## Measured (real Chrome, `scripts/mobile-snack-spike.mjs` and `scripts/mobile-snack-deps-spike.mjs`)
| Check | Result |
|---|---|
| Snack web player, one-line app, SDK 52 to 58 | renders on all seven |
| Snack web player, navigation, Reanimated, old Swipeable, ReanimatedSwipeable, AsyncStorage, one library per Snack | all five render on SDK 54 (our pins) and on SDK 58 (Expo's bundled versions) |
Caveat: this is the WEB player. It proves the preview we embed works on SDK 58; it does not prove the same code runs on a phone. The web player may also ignore a requested dependency version and use its own.

## SDK 58 versions (Expo's `bundledNativeModules.json`, read 14 Nov 2026)
react-native 0.88.1, react 19.3.0, reanimated 4.7.1 with react-native-worklets 0.13.0, gesture-handler ~3.3.0, screens ~4.30.1, safe-area-context ~5.11.1, svg 15.16.0, maps 1.29.11, webview 14.0.1, async-storage 2.2.0; expo-av is absent (use expo-audio and expo-video). The full table is in `src/lib/mobile-sdk.ts`.

## What is true in the repo today
- The prompt said SDK 54; the Snack route said 54 and pinned versions that look like SDK 53 (reanimated 3.17, screens 4.9, gesture-handler 2.24); public docs and the use-case FAQs say SDK 52 (`src/app/use-cases/[slug]/data.ts`, `src/lib/i18n/dict/use-cases-content.ts`, not changed here).
- SDK 55 and later run only on the New Architecture, Reanimated 4 needs it, expo-av was removed in 55, and the new Expo Go supports only SDK 58 (Expo changelog). Inference, not measured: an iPhone with the store version of Expo Go cannot open an SDK 54 project.

## What was built
- `src/lib/mobile-sdk.ts`: both version tables, `MOBILE_SDK_VERSION` (server env, default 54) selects which one the Snack route and the mobile prompt use, plus an SDK 58 rules block for the prompt (ReanimatedSwipeable, worklets plugin, expo-audio/video, strict TypeScript API).
- Default behaviour is unchanged. To try SDK 58: set `MOBILE_SDK_VERSION=58` on the server and redeploy, build one mobile app, open it in the preview.
- `src/lib/mobile-ready.ts` (flag `NEXT_PUBLIC_MOBILE_LAUNCH_READY`): contract M1 to M12, a 16-item source check, large-tier price floor.
- `src/lib/mobile-store-pack.ts`: a store pack (listing, privacy policy draft, Play Data safety, App Store privacy and age rating, AI disclosure and account deletion when they apply, release checklist) added to the export zip for every mobile project, 0 credits.

## Not measured, needs a person with a phone
- Does an SDK 58 app run in Expo Go on a real iPhone and Android phone?
- Does the exported project build with EAS on SDK 58 (the .aab build is gated; not run)?
- Do the five existing mobile templates still render on SDK 58?
