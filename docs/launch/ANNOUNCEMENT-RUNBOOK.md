# WyberCode 1.0 announcement: how to send it (planned for 10 Nov 2026)

Nothing has been sent. The tool is at `/admin/announce` (admin sign-in). Sending is OFF until you switch it on.

## Who gets what (counts from 9 Nov, after every safety rule)
| Audience | People | Email |
|---|---|---|
| Paying subscriber (Spark) | 1 | "Your Spark plan just got 3× the credits" |
| Builders (spent credits on a real build) | 105 | "WyberCode 1.0 is live, and your projects are right where you left them" |
| Newcomers (signed up, never built) | 413 | "Your first build on WyberAi takes about two minutes" |
| Held back on purpose | 241 | Started a project but never spent credits. Neither message is true for them. Decide later. |
| Left out | 24 | 5 disposable, 4 typo domains, 9 yours or test, 5 opted out, 1 invalid |

Previews of all three emails: Desktop > Wyber Ai > nov 9 WyberCode 1.0 > emails.

## Before you start (once)
1. Push this branch and promote the preview (the page and API are new code).
2. In Vercel, check production has `RESEND_API_KEY` (the backup route) and `CONTINUUM_API_KEY`. Do NOT set `ANNOUNCE_ENABLED` yet.
3. Optional: apply `supabase/migrations/20261109060000_uptime_state.sql` in the Supabase SQL editor (lets the uptime alert say "recovered").
4. Resend dashboard > Emails > filter "Bounced" > Export. Then, from the repo root:
   - `node scripts/apply-bounce-export.mjs <file.csv>` (dry run: counts only)
   - `node scripts/apply-bounce-export.mjs <file.csv> --apply` (marks those accounts as not to be emailed)
5. Check `https://api.continuumapi.com/health` answers 200.

## The Spark subscriber (1 person) first
1. `node scripts/grant-spark-credits.mjs` (dry run: shows the masked account, balance 62, would become 162).
2. `node scripts/grant-spark-credits.mjs --apply` (adds 100 credits once; a second run does nothing).
3. On `/admin/announce`, tick "The Spark subscriber already has the extra 100 credits".

## Then, in `/admin/announce`
1. Open the page. Read the counts. They should match the table above (small differences are fine).
2. For each audience press "Send a test" (goes to hello@wyberai.com only). Read it in the inbox AND check spam. Open the unsubscribe link in one test.
3. In Vercel set `ANNOUNCE_ENABLED=true` and redeploy. The page now says "Sending is ENABLED".
4. Spark: type 1, press Send. Then Builders: type the total shown (about 105), press Send. The page sends 8 at a time, about 5 seconds each, and shows progress. Press Stop at any time.
5. Wait a day. Look at replies, unsubscribes, and whether any landed in spam (ask a few friends with Gmail).
6. Newcomers (about 413) the next day if all is well.

## Safety rails (all enforced in code and tested)
- Test emails go only to wyberai.com, continuumapi.com and signalpulsehq.com addresses.
- A real send needs `ANNOUNCE_ENABLED=true`, and the total you typed must equal the live count.
- `ANNOUNCE_DISABLED=true` in Vercel stops everything at once.
- Each success is recorded in `email_events` (kind `announcement_wybercode_1_0`), so nobody gets it twice, even if you run it again.
- It stops after 3 failures in a row, and if it cannot record a send.
- Every email carries the signed unsubscribe link and a List-Unsubscribe header. Opt-outs and hard bounces are skipped.
- If Continuum fails, mail goes through Resend automatically.

## If something looks wrong
Set `ANNOUNCE_DISABLED=true` in Vercel (takes effect on the next deploy; the Stop button on the page stops the current run immediately). Then tell Claude what you saw.

## After the send
- Remove `ANNOUNCE_ENABLED` (or set it to false) so it cannot be used by accident.
- Delete the temporary Railway token and rotate the Dodo key if not done.
- Add a line to `docs/seo/LOG.md`? No: this is separate. Note the send in `docs/launch/`.
