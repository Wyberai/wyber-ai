# Wyber failure-mode map

Every place the product can break, organized by pipeline stage. ✅ = mitigation
exists in code today. ⚠️ = known gap. Status as of Jul 2 2026 (commit 4e1052d),
re-audited Jul 19 2026 — most of the Jul 2 gap list had already been closed by
later commits without this doc being updated; see the corrected rows below and
the new "Jul 19 audit" note at the bottom.

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
| A11 | Model imports npm package not in REQUIRED_DEPS | ✅ sanitize-files.ts scans every source file's bare imports and merges pinned versions for ~35 known packages into package.json (39 tests). Truly unknown packages are deliberately left alone (guessing a version breaks `npm install` harder than the missing module breaks vite) — self-heal covers that residual case |
| A12 | Context overflow on big projects | ✅ windowed history + file outlines + rolling project memory (needs migration 034 applied!) |
| A13 | Prompt injection via uploaded CSV/docs/knowledge | ✅ (Jul 19) attached-document content is now explicitly framed as DATA ONLY — the model is told to treat any embedded "ignore previous instructions"-style text literally as content, never as a command |
| A14 | Gemini fallback produces text-tag output while client expects tool-mode format | ✅ same <file> tag wire format either way |

## B. Applying output (client, ChatPanel)

| # | Failure | Status |
|---|---------|--------|
| B1 | saveProject PATCH fails silently (network blip) | ✅ ChatPanel's main saveProject has retry/backoff + a chat warning + auto-recovery message. The other save call sites (visual edits, self-heal persist, theme changes, image regen, version restore) used the same fire-and-forget pattern independently — extracted into a shared persist-project.ts helper (retry/backoff, saveStatus store field, same chat-warning UX) and wired everywhere (Jul 19) |
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
| C5 | Builder service down / unreachable | ✅ (partial, Jul 19) a thrown fetch (DNS/connection failure) now retries with backoff (0/1.5s/4s) before surfacing an error — previously went straight to error and could burn a self-heal attempt trying to "fix" a network blip. /status page already existed for visibility |
| C6 | Builder slow under load | ✅ live timer + rotating messages (perception managed) |
| C7 | vite build fails (syntax error) | ✅ auto-fix API (free) → chat self-heal, bounded at 3 attempts, then honest error UI |
| C8 | Concurrent build requests | ✅ pendingBuild queue (no dropped rebuilds) |
| C9 | Builder container runs out of OS threads ("failed to create new OS thread... errno=11") | ✅ found + fixed Jul 19: every build spawns `npx vite build`, which starts esbuild's own persistent "service" child process. `execSync` only signals its immediate shell child, so a build that errors or times out could orphan that service process — one more permanently-held OS thread, forever, until restart. NOT size-related: reproduced on a brand-new trivial 4-file app, not just large builds. Confirmed live in prod (wyber-preview-builder repo, separate service) before the fix: thread count climbing (32→31→29) across successive real requests. Fixed by running build commands in their own detached process group and killing the whole group after, success or failure, plus a startup reap for anything already orphaned. Verified post-fix: 3 clean builds + 3 intentionally-broken builds + 1 more clean build all succeeded with no thread errors |

## D. Preview runtime (inside the iframe)

| # | Failure | Status |
|---|---------|--------|
| D1 | Startup crash → blank white screen | ✅ error relay baked into index.html (cross-origin-proof) → self-heal; iframe reverts to last good build meanwhile |
| D2 | Late runtime error (user clicks buggy button) | ✅ logged, deliberately NOT build-breaking (prevents preview flapping) |
| D3 | supabase-js createClient throws (bad URL/key) | ✅ caught by D1 relay now |
| D4 | Supabase insert/update fails at runtime (RLS deny, missing column) and the APP ignores the error | ✅ "EVERY WRITE MUST BE HONEST" prompt rule in both the web and mobile Supabase contexts (generate/route.ts) — check `error` on every insert/update/delete, show a visible toast, never update local state before a clean write |
| D5 | Infinite render loop / hang | ⚠️ nothing catches it; iframe just freezes |
| D6 | External API calls blocked by CORS from preview origin | ⚠️ unhandled; users blame the builder |

## E. Supabase / backend

| # | Failure | Status |
|---|---------|--------|
| E1 | App built before Supabase connected (mock data) | ✅ storage-context prompt + "Wire my app to Supabase now" button post-connect |
| E2 | Connector row exists but creds broken | ✅ status='error' surfaced via X-Supabase-Status |
| E3 | OAuth access token expiry | ✅ auto-refresh in getMgmtToken/getValidToken |
| E4 | Refresh token revoked (user revoked in Supabase dashboard) | ✅ apply-schema/route.ts distinguishes "never OAuth-connected" from "was connected but token can't be refreshed" (reason: 'oauth-expired') and ChatPanel shows a clear reconnect prompt + the SQL as manual fallback |
| E5 | Schema SQL fails (syntax, perms) | ✅ error surfaced with manual fallback |
| E6 | RLS leaking data publicly | ✅ attacker's-view scanner + publish gate + one-click fix |
| E7 | User links WyberAi's own platform DB | ✅ PLATFORM_REF hard blocks everywhere |
| E8 | Auth emails redirect to localhost | ✅ updateAuthConfig on publish |
| E9 | Supabase FREE project auto-pauses after 1 week inactivity → published app dies | ✅ connectors/supabase/health/route.ts reports paused/restoring/ok status; PreviewPanel polls it every 5min while connected and shows a "paused, click to restore" banner wired to a one-click restore + poll-until-back loop |
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
| G2 | selfHeal/plan client flags as free-generation loophole | ✅ the flag is still client-asserted, but a server-side counter (credit_usage rows, reason='free-pass') caps free passes at 60/user/hour regardless — bounded abuse surface, verified the insert actually increments the counter |
| G3 | Payment webhook (Dodo/Stripe) fails → user paid, no credits | ✅ migration 20260702130000 added `processed_webhooks` for idempotency (confirmed applied in prod — real rows present) |
| G4 | Double-submit race on deduct | ✅ was NOT actually fixed everywhere despite the atomic `deduct_credits`/`adjust_credits` RPCs existing since Jul 2 — the highest-traffic deduct path in generate/route.ts still did the old precomputed-value update, silently under-charging under concurrency. Fixed Jul 19: wired to the RPC, verified atomic under 10 real concurrent requests (zero lost updates) |

## H. Auth / session / platform

| # | Failure | Status |
|---|---------|--------|
| H1 | Session expires mid-session | ✅ (Jul 19) both /api/generate (main build/edit path) and /api/assist (conversational lane) now show "Your session expired — Log in again" instead of a raw error dump |
| H2 | Signup email deliverability | ✅ fixed Jul 2 (launch blockers commit) |
| H3 | Secrets encryption key rotation | ✅ (Jul 19) decrypt failures now log clearly everywhere instead of `catch {}`. connectors/route.ts and rls-scan-project.ts's getAnonConnector also used to silently fall through to using the raw ciphertext AS the credential on decrypt failure — fixed to return null/fail the same way "not connected" does, so a broken key can't get used as if it were valid |

## I. Other connectors (Composio, GitHub, Stripe keys)

⚠️ Largely unaudited (founder flagged "other tools too"). Same classes apply:
token expiry/revocation, callback failures, raw-JSON dead ends in popups,
secrets that decrypt to garbage. Worth a dedicated pass replicating the
Supabase hardening pattern (self-closing popups, status surfacing, post-connect
action button).

## Top 6 gaps by user-visible damage (Jul 2 2026 — see Jul 19 audit note below; ALL SIX now closed)

1. **D4** — silent Supabase write failures (optimistic UI). The exact "backend doesn't work" complaint, still possible post-schema-fix.
2. **E9** — free-tier Supabase pausing kills published apps in ~1 week.
3. **B1** — silent saveProject failure can lose an entire build.
4. **G3/G4** — money: unreconciled payments, non-atomic credit math.
5. **A11** — unknown npm imports → avoidable self-heal loops.
6. **E4** — revoked OAuth silently downgrades schema auto-apply forever.

## Jul 19 2026 audit

Re-checked every ⚠️ row above against the actual current code (not just this
doc, which was never updated after Jul 2). Result: D4, E4, E9, and A11 had
already been fully fixed by commits since Jul 2 — this doc just never caught
up. G2/G3 were already reasonably mitigated (rate limit; idempotency table).
G4's atomic RPCs existed but the highest-traffic deduct call site never
actually called them — genuinely still broken, now fixed. H3 (silently
swallowed decrypt failures, including two spots that used raw ciphertext AS
the credential on failure) and H1 (session-expiry UX on the main build path)
were genuinely still open — now fixed. Also found a new, undocumented one:
**C9**, a real production infra bug (preview-builder OS thread exhaustion,
not size-related) — fixed and verified live the same day. Full test suite
(332 tests) and typecheck both green after all of the above.
