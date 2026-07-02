# Wyber failure-mode map

Every place the product can break, organized by pipeline stage. ✅ = mitigation
exists in code today. ⚠️ = known gap. Status as of Jul 2 2026 (commit 4e1052d).

## A. Generation (/api/generate)

| # | Failure | Status |
|---|---------|--------|
| A1 | Anthropic API down / 401 / 429 / overloaded | ✅ pre-stream errors fall back to Gemini 2.5 Flash |
| A2 | Stream dies MID-response (network, Vercel timeout) | ✅ partial-output detection client-side (fileCut/editCut → autofix continuation); refund if nothing produced |
| A3 | max_tokens cutoff mid-file | ✅ auto-continuation both paths; dangling tag closed; per-file rewrite retry in tool mode |
| A4 | Model ends turn early without App.tsx (new build) | ✅ forced follow-up turn + reserved pass past iteration budget + client-side free-lane retry |
| A5 | Model announces N files, emits fewer (non-entry files) | ⚠️ only the entry file is force-retried; other announced files are only stubbed (placeholder screens). Acceptable-ish, but "Workflows page is a stub" surprises users |
| A6 | Model writes confident prose, zero file/edit blocks | ✅ honest-error check → refund |
| A7 | Malformed tool-call JSON | ✅ logged + skipped, doesn't kill stream |
| A8 | edit_file SEARCH doesn't match file | ✅ failedPaths → autofix requests full file |
| A9 | Merge-conflict markers left in output | ✅ stripped on apply |
| A10 | Model re-creates existing files (data loss on rewrite) | ✅ prompt rule 7; not mechanically enforced ⚠️ |
| A11 | Model imports npm package not in REQUIRED_DEPS | ⚠️ build fails → self-heal loop burns time. Gap: parse imports pre-send, merge unknown deps into package.json (detect-deps.ts exists, not wired here) |
| A12 | Context overflow on big projects | ✅ windowed history + file outlines + rolling project memory (needs migration 034 applied!) |
| A13 | Prompt injection via uploaded CSV/docs/knowledge | ⚠️ no sanitization of document content fed to the model |
| A14 | Gemini fallback produces text-tag output while client expects tool-mode format | ✅ same <file> tag wire format either way |

## B. Applying output (client, ChatPanel)

| # | Failure | Status |
|---|---------|--------|
| B1 | saveProject PATCH fails silently (network blip) | ⚠️ fire-and-forget `.catch(() => {})` — user's files exist only in memory until next save; a tab close loses the build. Gap: retry queue + "unsaved" indicator |
| B2 | Immer-frozen store mutation | ✅ fixed (new objects on write) |
| B3 | Multi-tab editing same project | ⚠️ last-writer-wins, no conflict detection |
| B4 | Schema SQL auto-apply fails | ✅ surfaced in chat with manual SQL fallback; "already exists" treated as success |

## C. Preview build (remote builder service)

| # | Failure | Status |
|---|---------|--------|
| C1 | Missing entry/main/index.html | ✅ sanitizeFiles synthesizes |
| C2 | Tailwind stripped / no config → unstyled | ✅ sanitizeFiles guarantees compile inputs |
| C3 | Truncated builds importing never-written files | ✅ stub-missing-imports |
| C4 | File path used as both file and directory (EISDIR) | ✅ sanitizeFiles collision resolution |
| C5 | Builder service down / unreachable | ⚠️ single error message + manual retry button. Gap: automatic retry with backoff; no status page/health check |
| C6 | Builder slow under load | ✅ live timer + rotating messages (perception managed) |
| C7 | vite build fails (syntax error) | ✅ auto-fix API (free) → chat self-heal, bounded at 3 attempts, then honest error UI |
| C8 | Concurrent build requests | ✅ pendingBuild queue (no dropped rebuilds) |

## D. Preview runtime (inside the iframe)

| # | Failure | Status |
|---|---------|--------|
| D1 | Startup crash → blank white screen | ✅ error relay baked into index.html (cross-origin-proof) → self-heal; iframe reverts to last good build meanwhile |
| D2 | Late runtime error (user clicks buggy button) | ✅ logged, deliberately NOT build-breaking (prevents preview flapping) |
| D3 | supabase-js createClient throws (bad URL/key) | ✅ caught by D1 relay now |
| D4 | Supabase insert/update fails at runtime (RLS deny, missing column) and the APP ignores the error | ⚠️ biggest remaining backend gap: generated code often does optimistic UI; user sees "it worked", DB has nothing. Fix: prompt rule — every write must check `error` and show a visible toast; optionally relay supabase errors like D1 |
| D5 | Infinite render loop / hang | ⚠️ nothing catches it; iframe just freezes |
| D6 | External API calls blocked by CORS from preview origin | ⚠️ unhandled; users blame the builder |

## E. Supabase / backend

| # | Failure | Status |
|---|---------|--------|
| E1 | App built before Supabase connected (mock data) | ✅ storage-context prompt + "Wire my app to Supabase now" button post-connect |
| E2 | Connector row exists but creds broken | ✅ status='error' surfaced via X-Supabase-Status |
| E3 | OAuth access token expiry | ✅ auto-refresh in getMgmtToken/getValidToken |
| E4 | Refresh token revoked (user revoked in Supabase dashboard) | ⚠️ getMgmtToken silently returns null → auto-apply degrades forever. Gap: detect + prompt "reconnect Supabase" |
| E5 | Schema SQL fails (syntax, perms) | ✅ error surfaced with manual fallback |
| E6 | RLS leaking data publicly | ✅ attacker's-view scanner + publish gate + one-click fix |
| E7 | User links WyberAi's own platform DB | ✅ PLATFORM_REF hard blocks everywhere |
| E8 | Auth emails redirect to localhost | ✅ updateAuthConfig on publish |
| E9 | Supabase FREE project auto-pauses after 1 week inactivity → published app dies | ⚠️ nothing detects this. Gap: periodic health ping on published apps + "your database is paused, click to restore" notice. Users will blame Wyber |
| E10 | OAuth /start misconfig or signed-out user | ✅ self-closing popup posts error back to modal |

## F. Publish / deploy

| # | Failure | Status |
|---|---------|--------|
| F1 | Publish hangs | ✅ 180s abort + honest message |
| F2 | Critical RLS leak | ✅ 409 gate + explicit override |
| F3 | Custom domain DNS wrong | ✅ record instructions + provider detection |
| F4 | Republish feedback loop | ✅ fixed (inline progress + done state) |
| F5 | Published apps served in iframe (SEO) | ⚠️ known TODO (de-iframe) |

## G. Credits / billing

| # | Failure | Status |
|---|---------|--------|
| G1 | Charged for empty/failed generation | ✅ settleRefund, single-settle guard |
| G2 | selfHeal/plan client flags as free-generation loophole | ⚠️ partially closed in Plan Mode rework; autofix lane caps retries client-side but the flag is still client-asserted. Gap: server-side validation that a "selfHeal" call follows a recent paid failure |
| G3 | Payment webhook (Dodo/Stripe) fails → user paid, no credits | ⚠️ no reconciliation job / manual-grant admin path documented |
| G4 | Double-submit race on deduct | ⚠️ read-then-write credits update isn't atomic (refundCredits does select then update) |

## H. Auth / session / platform

| # | Failure | Status |
|---|---------|--------|
| H1 | Session expires mid-session | ⚠️ generate returns 401; client shows generic error, no re-login prompt |
| H2 | Signup email deliverability | ✅ fixed Jul 2 (launch blockers commit) |
| H3 | Secrets encryption key rotation | ⚠️ decrypt failures are silently swallowed in places (`catch {}`) — connector would look "broken" with no signal |

## I. Other connectors (Composio, GitHub, Stripe keys)

⚠️ Largely unaudited (founder flagged "other tools too"). Same classes apply:
token expiry/revocation, callback failures, raw-JSON dead ends in popups,
secrets that decrypt to garbage. Worth a dedicated pass replicating the
Supabase hardening pattern (self-closing popups, status surfacing, post-connect
action button).

## Top 6 gaps by user-visible damage

1. **D4** — silent Supabase write failures (optimistic UI). The exact "backend doesn't work" complaint, still possible post-schema-fix.
2. **E9** — free-tier Supabase pausing kills published apps in ~1 week.
3. **B1** — silent saveProject failure can lose an entire build.
4. **G3/G4** — money: unreconciled payments, non-atomic credit math.
5. **A11** — unknown npm imports → avoidable self-heal loops.
6. **E4** — revoked OAuth silently downgrades schema auto-apply forever.
