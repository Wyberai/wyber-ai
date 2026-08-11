import { createServiceClient } from '@/lib/supabase/server'
import { parseGenerationOutput, parseEditBlocks } from '@/lib/file-parser'
import { applyEdits } from '@/lib/patch-applier'
import { internalSecret } from '@/lib/internal-auth'

type FileVal = { path: string; content: string; language: string }

const LANG_MAP: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
  css: 'css', html: 'html', json: 'json', vue: 'vue',
}

function langFor(path: string): string {
  return LANG_MAP[path.split('.').pop() ?? ''] ?? 'plaintext'
}

/** Refund a charge /api/generate already took, for a failure only detectable
 *  downstream of it (e.g. every parsed edit block failed to apply against the
 *  real file content). Same adjust_credits RPC + read-then-write fallback
 *  /api/generate's own refundCredits() uses — duplicated here because that
 *  function lives unexported inside a route file. */
async function refundBuildCost(db: ReturnType<typeof createServiceClient>, userId: string, amount: number, reason: string) {
  if (!userId || amount <= 0) return
  try {
    const { data: adjusted, error } = await db.rpc('adjust_credits', { p_user_id: userId, p_delta: amount })
    let after = !error && typeof adjusted === 'number' ? adjusted : null
    if (after === null) {
      const { data: prof } = await db.from('profiles').select('credits').eq('id', userId).single()
      after = (prof?.credits ?? 0) + amount
      await db.from('profiles').update({ credits: after }).eq('id', userId)
    }
    const finalCredits = after ?? amount
    await db.from('credit_usage').insert({ user_id: userId, amount: -amount, reason: `refund:${reason}`, credits_before: finalCredits - amount, credits_after: finalCredits })
  } catch (e) { console.error('[mcp/build-runner] refund failed', e) }
}

/** Serialize a project's files into the `<file path="…">…</file>` context format
 *  that /api/generate expects (mirrors what the editor client sends). */
function serializeFileContext(files: Record<string, FileVal>): string {
  return Object.entries(files)
    .slice(0, 20)
    .map(([p, f]) => `<file path="${p}">\n${(f?.content ?? '').slice(0, 3000)}\n</file>`)
    .join('\n\n')
}

/**
 * Drains one queued mcp_messages row: runs the build by calling /api/generate
 * internally (which owns all prompt + credit + model-routing logic), persists
 * the generated files back onto the project, and marks the message done/error.
 *
 * Credits are NOT handled here — /api/generate deducts on build and refunds on
 * an empty generation natively, so there is a single source of truth. This
 * runner only owns the queue lifecycle and deterministic file persistence.
 *
 * Idempotent by construction: the atomic claim (queued → processing) guarantees
 * only one worker ever runs a given message, so the cron consumer can safely
 * retry stale rows.
 */
export async function processQueuedMessage(messageId: string): Promise<void> {
  const db = createServiceClient()

  // ── Atomic claim: only the worker that flips queued→processing proceeds ──
  // processing_started_at lets the cron consumer's stale-reclaim key off when
  // this row actually started running, not when it was queued — a message
  // queued behind others for a while is not "stuck". A partial unique index
  // (one row per project_id where status='processing') also makes this same
  // update fail with a constraint violation if another message for the same
  // project is already in flight, so `claimed` comes back null and this
  // worker naturally backs off instead of racing a concurrent build.
  const { data: claimed } = await db
    .from('mcp_messages')
    .update({ status: 'processing', processing_started_at: new Date().toISOString() })
    .eq('id', messageId)
    .eq('status', 'queued')
    .select('id, project_id, user_id, message, project_type, palette_id')
    .single()

  if (!claimed) return // already claimed by another tick, not queued, or another build for this project is in flight

  const fail = async (error: string) => {
    await db.from('mcp_messages')
      .update({ status: 'error', error: error.slice(0, 2000), processed_at: new Date().toISOString() })
      .eq('id', claimed.id)
  }

  try {
    // ── Load the target project (scoped to the key owner) ──
    const { data: project } = await db
      .from('projects')
      .select('id, name, files, framework, user_id')
      .eq('id', claimed.project_id)
      .eq('user_id', claimed.user_id)
      .single()

    if (!project) { await fail('Project not found'); return }

    const files = (project.files as Record<string, FileVal>) ?? {}
    const isFirstBuild = Object.keys(files).length === 0
    // Use explicit project_type if provided, otherwise derive from framework
    const projectType = claimed.project_type || (project.framework === 'react-native' ? 'mobile' : 'web-app')
    const fileContext = isFirstBuild ? '' : serializeFileContext(files)

    // ── Run the build via /api/generate (internal, cookie-less bypass) ──
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Scheduler-User-Id': claimed.user_id,
        'X-Scheduler-Secret': internalSecret(),
      },
      body: JSON.stringify({
        prompt: claimed.message,
        fileContext,
        projectId: project.id,
        projectType,
        isFirstBuild,
        paletteId: claimed.palette_id ?? undefined,
        history: [],
        stage: 'full',
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      let msg = `Build failed (${res.status})`
      try { const j = JSON.parse(body); if (j?.error) msg = j.error } catch { /* keep default */ }
      await fail(msg)
      return
    }

    // Read the real charged amount before draining the body, so a downstream
    // no-op (below) can refund exactly what was taken.
    const creditsCharged = Number(res.headers.get('X-Credits-Used') ?? '0') || 0

    // /api/generate streams the raw model text — drain it fully.
    const generatedText = await res.text()

    // ── Persist deterministically (there's no editor client to save for us) ──
    const { files: newFiles } = parseGenerationOutput(generatedText)
    const editBlocks = parseEditBlocks(generatedText)
    if (newFiles.length === 0 && editBlocks.length === 0) {
      // Generate already refunded the credits for an empty generation.
      await fail('The build produced no file changes. Try rephrasing your request.')
      return
    }

    const merged: Record<string, FileVal> = { ...files }
    for (const { path, content } of newFiles) {
      merged[path] = { path, content, language: langFor(path) }
    }
    let appliedEdits = 0
    if (editBlocks.length > 0) {
      const result = applyEdits(merged, editBlocks)
      appliedEdits = result.appliedCount
      for (const [path, content] of Object.entries(result.updated)) {
        merged[path] = { path, content, language: langFor(path) }
      }
    }

    // The model emitted edit blocks, but none of them actually matched the
    // real file content (fuzzy match included) — e.g. because the file
    // context sent to it was truncated. Unlike an empty generation, /api/generate
    // has no way to see this failure (it never inspects whether the edits it
    // emitted apply), so it already charged for this turn — refund it here
    // instead of reporting a false "done" with N changes on an untouched project.
    if (newFiles.length === 0 && appliedEdits === 0) {
      await refundBuildCost(db, claimed.user_id, creditsCharged, 'mcp-edit-apply-failed')
      await fail('The build produced changes that could not be applied to your project (the edit no longer matched the file content). Any credits charged were refunded — try rephrasing your request or asking for a smaller change.')
      return
    }

    // Checkpoint the pre-build files as a version before overwriting them.
    // list_versions/restore_version are otherwise permanently dead for any
    // project built purely through Claude/MCP — the only other writer of
    // project_versions is the web editor's own "Save Version" button
    // (src/components/editor/VersionHistory.tsx), which an MCP-only user
    // never touches. Best-effort: a failed checkpoint must never block the
    // build itself.
    if (!isFirstBuild) {
      try {
        await fetch(`${baseUrl}/api/versions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Scheduler-User-Id': claimed.user_id,
            'X-Scheduler-Secret': internalSecret(),
          },
          body: JSON.stringify({
            // project_versions.files stores the full {path, content, language}
            // shape (see VersionHistory.tsx's saveVersion) — restore_version
            // writes this straight back onto projects.files, so anything
            // narrower here (e.g. plain content strings) would corrupt every
            // file on restore.
            projectId: project.id,
            files,
            label: `Before: ${claimed.message.slice(0, 60)}`,
          }),
        })
      } catch (e) { console.error('[mcp/build-runner] version checkpoint failed', e) }
    }

    await db.from('projects')
      .update({ files: merged, updated_at: new Date().toISOString() })
      .eq('id', project.id)

    // Auto-publish the project so Claude immediately has a live URL.
    // /api/publish always runs the Vite web bundler — it has no concept of
    // project_type — so it can never succeed for a mobile/Expo project
    // (confirmed live: every mobile build's publish attempt fails with
    // "ENOENT ... src/main.tsx", the entry point a Vite build expects that a
    // React Native project doesn't have). Mobile previews go through Expo
    // (see mobile-preview-expo-pivot), not this static-site pipeline —
    // skip the doomed attempt instead of masking a real generation result
    // behind a guaranteed publish failure.
    let publishedUrl = null
    if (projectType !== 'mobile') {
      const publishRes = await fetch(`${baseUrl}/api/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Scheduler-User-Id': claimed.user_id,
          'X-Scheduler-Secret': internalSecret(),
        },
        body: JSON.stringify({ projectId: project.id }),
      })

      if (publishRes.ok) {
        const publishData = await publishRes.json().catch(() => ({}))
        // /api/publish returns `publishedUrl`, not `url` — reading the wrong
        // field meant every MCP auto-publish silently recorded a null URL here.
        publishedUrl = (publishData as { publishedUrl?: string }).publishedUrl ?? null
      }
    }

    const changed = newFiles.length + appliedEdits
    await db.from('mcp_messages')
      .update({
        status: 'done',
        response: `✅ Build complete — ${changed} file change(s). ${publishedUrl ? `Live: ${publishedUrl}` : 'Project updated.'}`,
        published_url: publishedUrl,
        processed_at: new Date().toISOString(),
      })
      .eq('id', claimed.id)
  } catch (err) {
    await fail(String(err))
  }
}
