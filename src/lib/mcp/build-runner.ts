import { createServiceClient } from '@/lib/supabase/server'
import { parseGenerationOutput, parseEditBlocks } from '@/lib/file-parser'
import { applyEdits } from '@/lib/patch-applier'

type FileVal = { path: string; content: string; language: string }

const LANG_MAP: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
  css: 'css', html: 'html', json: 'json', vue: 'vue',
}

function langFor(path: string): string {
  return LANG_MAP[path.split('.').pop() ?? ''] ?? 'plaintext'
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
  const { data: claimed } = await db
    .from('mcp_messages')
    .update({ status: 'processing' })
    .eq('id', messageId)
    .eq('status', 'queued')
    .select('id, project_id, user_id, message')
    .single()

  if (!claimed) return // already claimed by another tick, or not queued

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
    const projectType = project.framework === 'react-native' ? 'mobile' : 'web'
    const fileContext = isFirstBuild ? '' : serializeFileContext(files)

    // ── Run the build via /api/generate (internal, cookie-less bypass) ──
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Scheduler-User-Id': claimed.user_id,
        'X-Scheduler-Secret': process.env.CRON_SECRET!,
      },
      body: JSON.stringify({
        prompt: claimed.message,
        fileContext,
        projectId: project.id,
        projectType,
        isFirstBuild,
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
    if (editBlocks.length > 0) {
      const result = applyEdits(merged, editBlocks)
      for (const [path, content] of Object.entries(result.updated)) {
        merged[path] = { path, content, language: langFor(path) }
      }
    }

    await db.from('projects')
      .update({ files: merged, updated_at: new Date().toISOString() })
      .eq('id', project.id)

    const changed = newFiles.length + editBlocks.length
    await db.from('mcp_messages')
      .update({
        status: 'done',
        response: `Build complete — ${changed} file change(s) applied. Project now has ${Object.keys(merged).length} file(s).`,
        processed_at: new Date().toISOString(),
      })
      .eq('id', claimed.id)
  } catch (err) {
    await fail(String(err))
  }
}
