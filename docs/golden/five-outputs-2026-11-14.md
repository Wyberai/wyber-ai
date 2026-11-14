# Five outputs with launch-ready on, 14 Nov 2026 (one build each, real editor, owned test account)

Credits spent: 1,947 to 1,565 (382). Browser checker = scripts/verify-app.mjs on the published page. "Source/DOM checks" = my own inspection of the generated files and rendered DOM, listed under each output.
The checker's score is out of 100 on what a browser can see; it is NOT the full scorecard. Where it cannot reach (sign-in, setup, flows) I say so.

| Output | Prompt | Charged | Checker | My overall estimate | At 95? |
|---|---|---|---|---|---|
| Web app (DentalDesk) | Dental clinic appointment manager | 80 (+4 images) | 96 | about 90 | not proven |
| Website (Smilecraft) | Dental clinic in Ahmedabad | 50 (+7 images) | 87 (85 of 85 applicable) | about 84 | no |
| SaaS (Chairside) | Salon scheduling with plans | 80 | 85 (landing only; sign-up walked by hand) | about 86 | no |
| Mobile (HabitLoop) | Habit tracker | 80 | not measurable in a browser; source checks only | about 80 | no |
| Replace-your-SaaS (Ledgerline) | Pipedrive, 8 core features | 80 | 82 (sign-in screen only) | about 80 | no |

## Web app
Checker: 0 console errors, 0 axe violations, no overflow, 8/8 navigation, 0 design-slop signs, first paint 536 ms, layout shift 0, keyboard 25 distinct stops of 38 controls with a visible ring everywhere, 5 of 7 launch signals (browser-only note, demo data, privacy, print, history on screen; import and export not seen on visited screens).
Not proven: `--flow` pressed Save but the new record did not appear (form needs more than one field), so add, reload and persist is unverified; CSV import and export never exercised.

## Website
Seen: 0 axe, 0 slop signs, one primary action, real hero image, asymmetric split, language toggle (English, Hindi, Gujarati) that persists, title and meta set, honeypot field, "We use your details only to reply to your enquiry", button reads "Send on WhatsApp", no invented doctor, hours, years or claims (contract W1 and W6 held).
Problems: (1) owner-details is empty, so the page has NO working contact path: the hero button has no wa.me link and the form cannot deliver; (2) a note meant for the owner ("Add the clinic WhatsApp number or email in owner-details to turn this on") is visible to every visitor; (3) with no facts supplied, the doctor and timings sections are empty headings. Fix: ask for phone and hours before building (or read them from the Grow panel) and keep owner notes out of the published page.

## SaaS (signed up in demo mode by script)
Seen: demo-mode line "Demo mode: nothing is charged, sent or stored on a server", Setup screen listing Stripe and Supabase variable names with "Not connected" and an honest "could not reach the status check", plan page with "Price set by the owner" and "Connect payments to enable", no stray prices, no invented claims, no Google button, first-run checklist, owner overview, booking page, staff and services screens.
Not seen in my walk: Terms and Privacy, Export my data and Delete my account (likely on the Settings "Your data" tab, not opened), roles shown by name. Demo data shows "3 of 2 staff" on the free plan.

## Mobile (source and chat only)
Files: lib/db.ts (AsyncStorage), lib/owner-details.ts, lib/notifications.ts, four screens, theme, ui. Present: "Everything is saved on this phone only", "Load sample data (demo)", export and delete my data, 26 accessibility labels plus roles, safe-area, skeleton, retry, notifications that open the record, a denied-permission path (openSettings), no invented insights.
Missing or doubtful: no app.json (app identity), 1 emoji, Swipeable used (visible alternative unverified), web leftovers in the mobile project (index.html, vite.config.ts, src/main.tsx). Not run on a device; SDK 54 preview.

## Replace-your-SaaS
Seen: src/replacement-checklist.ts with 8 features, all 8 on a screen; 6 marked "simplified" and 2 "built" (honest, but thin for a CRM replacement); cut-over page with what you pay now, parallel run and rollback; import with column mapping, preview, error list and dry run; no "perfect migration" claim; sign-in note says accounts and data stay on this device.
Price finding: the /byos quote promises 160 for a build this size; it was charged 80. Cause: my first launch-ready change forced the cheaper price column. Fixed in 1a8c457 (pushed, needs promote).

## What blocks 95, in order
1. Website has no contact facts, so no working contact path.
2. Flows are unverified for every output: add a record, import, export, reload.
3. Mobile cannot be measured in a browser and lacks app.json.
4. Pages behind sign-in need a scripted sign-up the checker does not have yet.
5. Replace builds mark most features "simplified".
