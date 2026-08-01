/**
 * WyberCode shadow-mode comparison (plan Phase 5). Called from the SAME
 * post-response `after()` hook generate/route.ts already uses for project-
 * memory distillation — that hook runs after the response has streamed to
 * the user and adds zero latency to the build, which is exactly the
 * property shadow-mode needs: replay the same prompt through WyberCode,
 * discard its output entirely, log only comparison metrics.
 *
 * Gated by its own WYBERCODE_SHADOW_MODE flag, independent of
 * WYBERCODE_ENABLED (the real-traffic rollout switch in wybercode.ts) — you
 * shadow-test BEFORE ever enabling real rollout, so these must be separately
 * controllable. Both default off.
 *
 * Known gap, deliberately not built here: the plan's automated scoring also
 * wants "did the output actually `vite build`" (reusing the self-heal C7
 * check against the external preview-builder service). Wiring that in means
 * pulling in that service's client from a background hook, which is more
 * integration than this pass should take on blind — left as a follow-up
 * once real shadow rows exist to prioritize against. For now this logs
 * file/edit-block counts and elapsed time, which is enough to start
 * measuring the two things the plan's rollout bar actually gates on: build
 * success proxy (did it produce real blocks at all) and the latency target.
 */
import { createAdminClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'
import { runWyberCode, classifyWyberCodeFailure } from './wybercode'

export interface ShadowRunInput {
  projectId?: string | null
  userId?: string | null
  stage: string
  actionType: string
  systemPrompt: string
  userPrompt: string
  fileContext?: string
  projectType?: string
  isNewBuild?: boolean
  claudeText: string
  claudeElapsedMs: number
}

function countBlocks(text: string): number {
  return (text.match(/<(?:file|edit) path="/g) || []).length
}

/** Never throws — a shadow-run failure must never affect the real request
 * that triggered it (this always runs from within `after()`, post-response,
 * but a thrown error there still surfaces in platform logs as a function
 * error, which would be a confusing false alarm for an intentionally
 * best-effort background comparison). */
export async function runShadowComparison(input: ShadowRunInput): Promise<void> {
  if (process.env.WYBERCODE_SHADOW_MODE !== 'true') return
  const startedAt = Date.now()
  let wybercodeText = ''
  let pagesFromTemplate = 0
  let pagesFullGen = 0
  let fallbackReason: string | null = null
  try {
    const result = await runWyberCode({
      systemPrompt: input.systemPrompt,
      userPrompt: input.userPrompt,
      fileContext: input.fileContext,
      projectType: input.projectType,
      isNewBuild: input.isNewBuild,
    })
    wybercodeText = result.text
    pagesFromTemplate = result.pagesFromTemplate
    pagesFullGen = result.pagesFullGen
    fallbackReason = classifyWyberCodeFailure(result)
  } catch (e) {
    fallbackReason = e instanceof Error ? e.constructor.name : 'unknown-error'
  }
  const wybercodeElapsedMs = Date.now() - startedAt

  try {
    const admin = await createAdminClient()
    await admin.from('wybercode_shadow_runs').insert({
      project_id: input.projectId ?? null,
      user_id: input.userId ?? null,
      // Hash only — this is internal eval, not a place to retain user
      // prompts/code verbatim (see the migration's own comment).
      prompt_hash: createHash('sha256').update(input.userPrompt).digest('hex'),
      stage: input.stage,
      action_type: input.actionType,
      claude_files_written: countBlocks(input.claudeText),
      claude_elapsed_ms: input.claudeElapsedMs,
      wybercode_files_written: countBlocks(wybercodeText),
      wybercode_elapsed_ms: wybercodeElapsedMs,
      pages_from_template: pagesFromTemplate,
      pages_full_gen: pagesFullGen,
      fallback_reason: fallbackReason,
    })
  } catch (e) {
    console.error('[wybercode-shadow] failed to log comparison row:', e)
  }
}
