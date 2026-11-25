# Platform rules we depend on (dated, with sources)

Review monthly. Every line says where it came from and when it was last checked. "secondary" means a blog or aggregator, confirm on the official page before relying on it.

| Rule or version | Value | Source | Checked |
|---|---|---|---|
| Expo SDK current | 58 (React Native 0.88, New Architecture only since SDK 55, expo-av removed in 55) | https://expo.dev/changelog/sdk-58 | 14 Nov 2026 |
| Expo SDK 58 bundled versions | see src/lib/mobile-sdk.ts | https://unpkg.com/expo@58/bundledNativeModules.json | 14 Nov 2026 |
| Snack web player supports | SDK 52 to 58 (one-line app and five libraries) | scripts/mobile-snack-spike.mjs, scripts/mobile-snack-deps-spike.mjs | 14 Nov 2026 |
| Google Play target API | Android 16 (API 36) for new apps and updates since 31 Aug 2026 | https://developer.android.com/google/play/requirements/target-sdk (secondary summaries) | 13 Nov 2026 |
| Google Play AI data policy | document what user data reaches AI services (update of 15 Jul 2026) | https://appsops.store/news/google-play-august-2026-deadlines-api36-ai-policy (secondary) | 13 Nov 2026 |
| Apple build requirement | Xcode 26 or later since 28 Apr 2026 | https://developer.apple.com/news/upcoming-requirements/ | 13 Nov 2026 |
| Supabase keys | legacy anon and service_role deprecated by end of 2026; new keys are not JWTs | https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys | 13 Nov 2026 |
| India DPDP Rules | consent-manager provisions from 13 Nov 2026; notice and consent duties from 13 May 2027, possibly earlier | law-firm notes (secondary) | 13 Nov 2026 |
| RBI e-mandate framework | issued 21 Apr 2026; recurring debits up to 15,000 rupees without OTP after registration; revocation must stop debits | https://www.taxmann.com/post/blog/rbi-e-mandate-framework-for-recurring-payments/ (secondary) | 13 Nov 2026 |
| Gmail and Yahoo bulk senders | SPF, DKIM, DMARC alignment, one-click unsubscribe (RFC 8058), complaints under 0.3% | https://powerdmarc.com/google-and-yahoo-email-authentication-requirements/ (secondary) | 13 Nov 2026 |
| Core Web Vitals | LCP 2.5 s, INP 200 ms, CLS 0.1 (some blogs claim tighter; unconfirmed) | web.dev (secondary summaries) | 13 Nov 2026 |
| Google AI search | llms.txt and AI-specific markup give no advantage; LocalBusiness markup and Business Profile still matter | secondary summaries of Google's May 2026 guide | 13 Nov 2026 |
| WhatsApp Business pricing | per-message since Jul 2025; India rates changed 2026; sources conflict, check Meta's rate card | https://developers.facebook.com/docs/whatsapp/pricing | 13 Nov 2026 |
| Web stack current | React 19.2, Vite 8 (Mar 2026), Tailwind 4 (CSS-first), motion/react | vite.dev, tailwindcss.com, motion.dev (secondary for versions) | 13 Nov 2026 |
| unslop (design rules) | CC BY 4.0, Damir Sokolovsky, credit required | https://github.com/heydamir/unslop | 14 Nov 2026 |
